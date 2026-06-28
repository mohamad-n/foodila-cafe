import "server-only";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { encode } from "blurhash";
import { Prisma } from "@/lib/generated/prisma/client";
import { getTenantPrisma } from "@/lib/tenant";
import { putObject, assertCafeKey } from "@/lib/storage";

/**
 * Default-menu seeder — imports the bundled `data.json` + item photos from `item_images/` into a
 * café. Invoked in-app by a super-admin Server Action (see app/(platform)/cafes/actions.ts).
 *
 * Tenant-safe: writes go through `getTenantPrisma(cafeId)`, which auto-injects `cafeId` into every
 * Category/Item/ItemImage read+write — so a forgotten filter can't cross tenants.
 *
 * Idempotent / additive:
 *  - Categories upsert by (cafe, fa-title); Items by (cafe, category, fa-title) — re-running updates
 *    name/subtitle/price/ingredients/order instead of duplicating. It never deletes rows absent from
 *    data.json.
 *  - A photo attaches only when `item_images/<English title>.png` exists and the item has no image
 *    yet; the stored master is normalized to JPEG so imgproxy reads from a small source.
 */
const SEED_DIR = join(process.cwd(), "lib/seed");
const IMAGES_DIR = join(SEED_DIR, "item_images");

type SeedItem = { title: string; enTitle: string; price: number; ingredients?: string };
type SeedCategory = { title: string; subtitle: string | null; engTitle: string; items: SeedItem[] };
type SeedData = { categories: SeedCategory[] };

function loadSeedData(): SeedData {
  return JSON.parse(readFileSync(join(SEED_DIR, "data.json"), "utf8")) as SeedData;
}

export type SeedMenuResult = {
  categoriesUpserted: number;
  itemsUpserted: number;
  imagesImported: number;
  imagesSkipped: number;
  imageFailures: number;
  unmatchedImages: string[];
};

/** The seed stores ingredients as one comma-separated string; the model wants string[]. */
function parseIngredients(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Normalize a source photo to a small JPEG master, upload it, and create the ItemImage row. */
async function importItemImage(
  tdb: ReturnType<typeof getTenantPrisma>,
  cafeId: string,
  itemId: string,
  file: string,
): Promise<void> {
  // Cap the long edge + re-encode to JPEG: source PNGs are lossless full-res (~1.5 MB); this master
  // is ~5–10× smaller with no visible loss at menu sizes. imgproxy still transcodes to AVIF/WebP.
  const normalized = await sharp(readFileSync(file))
    .rotate() // honor EXIF orientation before metadata is dropped
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  const meta = await sharp(normalized).metadata();

  const { data: raw, info } = await sharp(normalized)
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: "inside" })
    .toBuffer({ resolveWithObject: true });
  const blurhash = encode(new Uint8ClampedArray(raw), info.width, info.height, 4, 3);

  const objectKey = `cafes/${cafeId}/items/${itemId}/seed.jpg`;
  assertCafeKey(cafeId, objectKey);
  await putObject(objectKey, normalized, "image/jpeg");

  // `cafeId` is also force-injected by the scoped client; passing it satisfies the create type.
  await tdb.itemImage.create({
    data: { cafeId, itemId, objectKey, width: meta.width ?? 0, height: meta.height ?? 0, blurhash, sortOrder: 0 },
  });
}

/** Seed the bundled default menu into `cafeId`. Returns counts; the caller revalidates + audits. */
export async function seedCafeMenu(cafeId: string): Promise<SeedMenuResult> {
  const tdb = getTenantPrisma(cafeId);
  const data = loadSeedData();

  const usedFiles = new Set<string>();
  const result: SeedMenuResult = {
    categoriesUpserted: 0,
    itemsUpserted: 0,
    imagesImported: 0,
    imagesSkipped: 0,
    imageFailures: 0,
    unmatchedImages: [],
  };

  for (const [c, category] of data.categories.entries()) {
    const name = { fa: category.title, en: category.engTitle };
    const subtitle = category.subtitle ? { fa: category.subtitle } : null;

    const existingCat = await tdb.category.findFirst({
      where: { name: { path: ["fa"], equals: category.title } },
      select: { id: true },
    });
    const cat = existingCat
      ? await tdb.category.update({
          where: { id: existingCat.id },
          data: { name, subtitle: subtitle ?? Prisma.DbNull, sortOrder: c },
        })
      : await tdb.category.create({
          data: { cafeId, name, subtitle: subtitle ?? undefined, sortOrder: c },
        });
    result.categoriesUpserted++;

    for (const [i, item] of category.items.entries()) {
      const itemName = { fa: item.title, en: item.enTitle };
      const ingredients = parseIngredients(item.ingredients);
      const existingItem = await tdb.item.findFirst({
        where: { categoryId: cat.id, name: { path: ["fa"], equals: item.title } },
        select: { id: true },
      });
      const row = existingItem
        ? await tdb.item.update({
            where: { id: existingItem.id },
            data: { name: itemName, price: item.price, ingredients, sortOrder: i, categoryId: cat.id },
          })
        : await tdb.item.create({
            data: { cafeId, categoryId: cat.id, name: itemName, price: item.price, ingredients, sortOrder: i },
          });
      result.itemsUpserted++;

      // Photo: strict <English title>.png match.
      const file = join(IMAGES_DIR, `${item.enTitle}.png`);
      if (!existsSync(file)) continue;
      usedFiles.add(`${item.enTitle}.png`);

      if ((await tdb.itemImage.count({ where: { itemId: row.id } })) > 0) {
        result.imagesSkipped++;
        continue;
      }
      try {
        await importItemImage(tdb, cafeId, row.id, file);
        result.imagesImported++;
      } catch {
        result.imageFailures++;
      }
    }
  }

  result.unmatchedImages = existsSync(IMAGES_DIR)
    ? readdirSync(IMAGES_DIR).filter((f) => f.endsWith(".png") && !usedFiles.has(f))
    : [];

  return result;
}
