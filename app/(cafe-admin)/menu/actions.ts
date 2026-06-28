"use server";

import { revalidateTag } from "next/cache";
import sharp from "sharp";
import { encode } from "blurhash";
import { requireCafeRole, AuthorizationError } from "@/lib/auth";
import { getTenantPrisma } from "@/lib/tenant";
import { getObjectBuffer, deleteObject, assertCafeKey } from "@/lib/storage";
import { type ActionResult, zodToActionResult } from "@/lib/action-result";
import {
  CategoryInput,
  ItemInput,
  IdInput,
  ToggleInput,
  ImageAttachInput,
  type Localized,
} from "./schema";

const ROLES = ["OWNER", "ADMIN", "STAFF"] as const;

function localized(fa: string, en?: string): Localized {
  return en ? { fa, en } : { fa };
}

function parseIngredients(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Maps a thrown guard error to a user-safe result; rethrows anything unexpected. */
function authError(e: unknown): ActionResult | never {
  if (e instanceof AuthorizationError) {
    return {
      ok: false,
      error: e.kind === "UNAUTHENTICATED" ? "ابتدا وارد شوید." : "اجازهٔ این کار را ندارید.",
    };
  }
  throw e;
}

export async function upsertCategory(raw: CategoryInput): Promise<ActionResult> {
  const parsed = CategoryInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const input = parsed.data;

  try {
    const { cafeId } = await requireCafeRole(input.cafeId, [...ROLES]);
    const db = getTenantPrisma(cafeId);
    const data = {
      name: localized(input.nameFa, input.nameEn),
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    };
    if (input.id) {
      await db.category.update({ where: { id: input.id }, data });
    } else {
      // `cafeId` is also force-injected by the scoped client; passing it satisfies the create type.
      await db.category.create({ data: { ...data, cafeId } });
    }
    revalidateTag(`menu:${cafeId}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

export async function deleteCategory(raw: { cafeId: string; id: string }): Promise<ActionResult> {
  const parsed = IdInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { cafeId, id } = parsed.data;
  try {
    await requireCafeRole(cafeId, [...ROLES]);
    const db = getTenantPrisma(cafeId);
    await db.category.delete({ where: { id } }); // cascades to its items
    revalidateTag(`menu:${cafeId}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

export async function upsertItem(raw: ItemInput): Promise<ActionResult> {
  const parsed = ItemInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const input = parsed.data;

  try {
    const { cafeId } = await requireCafeRole(input.cafeId, [...ROLES]);
    const db = getTenantPrisma(cafeId);
    const data = {
      categoryId: input.categoryId,
      name: localized(input.nameFa, input.nameEn),
      description: input.descriptionFa
        ? localized(input.descriptionFa, input.descriptionEn)
        : undefined,
      ingredients: parseIngredients(input.ingredients),
      calories: input.calories ?? null,
      price: input.price ?? null,
      isAvailable: input.isAvailable,
      sortOrder: input.sortOrder,
    };
    if (input.id) {
      await db.item.update({ where: { id: input.id }, data });
    } else {
      await db.item.create({ data: { ...data, cafeId } });
    }
    revalidateTag(`menu:${cafeId}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

export async function deleteItem(raw: { cafeId: string; id: string }): Promise<ActionResult> {
  const parsed = IdInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { cafeId, id } = parsed.data;
  try {
    await requireCafeRole(cafeId, [...ROLES]);
    const db = getTenantPrisma(cafeId);
    await db.item.delete({ where: { id } });
    revalidateTag(`menu:${cafeId}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

export async function toggleItemAvailability(
  raw: { cafeId: string; id: string; isAvailable: boolean },
): Promise<ActionResult> {
  const parsed = ToggleInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { cafeId, id, isAvailable } = parsed.data;
  try {
    await requireCafeRole(cafeId, [...ROLES]);
    const db = getTenantPrisma(cafeId);
    await db.item.update({ where: { id }, data: { isAvailable } });
    revalidateTag(`menu:${cafeId}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

/**
 * Called by the client uploader after the browser PUTs the file to MinIO. Computes
 * dimensions + blurhash server-side (never trust the client) and writes the ItemImage row.
 */
export async function attachImage(raw: ImageAttachInput): Promise<ActionResult> {
  const parsed = ImageAttachInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "ورودی نامعتبر است." };
  const { cafeId, itemId, objectKey } = parsed.data;

  try {
    await requireCafeRole(cafeId, [...ROLES]);
    assertCafeKey(cafeId, objectKey); // key must be under this café's prefix
    const db = getTenantPrisma(cafeId);

    // The item must belong to this café (scoped read returns null otherwise).
    const item = await db.item.findUnique({ where: { id: itemId }, select: { id: true } });
    if (!item) return { ok: false, error: "آیتم یافت نشد." };

    const buf = await getObjectBuffer(objectKey);
    const image = sharp(buf);
    const meta = await image.metadata();
    const { data, info } = await image
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: "inside" })
      .toBuffer({ resolveWithObject: true });
    const blurhash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);

    const sortOrder = await db.itemImage.count({ where: { itemId } });
    await db.itemImage.create({
      data: {
        cafeId,
        itemId,
        objectKey,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        blurhash,
        sortOrder,
      },
    });
    revalidateTag(`menu:${cafeId}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

export async function deleteImage(raw: { cafeId: string; id: string }): Promise<ActionResult> {
  const parsed = IdInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { cafeId, id } = parsed.data;
  try {
    await requireCafeRole(cafeId, [...ROLES]);
    const db = getTenantPrisma(cafeId);
    const image = await db.itemImage.findUnique({ where: { id }, select: { objectKey: true } });
    await db.itemImage.delete({ where: { id } });
    if (image) await deleteObject(image.objectKey); // remove the MinIO object too
    revalidateTag(`menu:${cafeId}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}
