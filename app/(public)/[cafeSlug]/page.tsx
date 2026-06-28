import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { getTenantPrisma } from "@/lib/tenant";
import { imgUrl, imgSrcSet, blurhashToDataURL } from "@/lib/image";
import { ThemeScope } from "@/components/menu/core/ThemeScope";
import { TEMPLATES } from "@/components/menu/registry";
import type { Localized, MenuCategory } from "@/components/menu/types";

// Static + ISR. Admin writes call revalidateTag("menu:"+cafeId); the menu refreshes within seconds.
export const revalidate = 3600;

const SRCSET_WIDTHS = [480, 720, 1000, 1280];

const getCafe = (slug: string) =>
  unstable_cache(
    () =>
      db.cafe.findFirst({
        where: { slug, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          defaultLocale: true,
          template: true,
          themeTokens: true,
          logoKey: true,
          faviconKey: true,
          metaTitle: true,
          metaDescription: true,
          showCalories: true,
          showPrice: true,
        },
      }),
    ["public-cafe", slug],
    { tags: [`cafe:${slug}`], revalidate: 3600 },
  )();

// Calorie/price visibility is a café setting, applied at the DTO boundary so templates stay
// flag-agnostic. The flags are part of the cache key (a toggle yields a fresh entry) and the
// menu:{cafeId} tag is revalidated when they change.
const getMenu = (cafeId: string, showCalories: boolean, showPrice: boolean) =>
  unstable_cache(
    async (): Promise<MenuCategory[]> => {
      const tdb = getTenantPrisma(cafeId);
      const cats = await tdb.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: { images: { orderBy: { sortOrder: "asc" } } },
          },
        },
      });

      // Hide empty categories: a category with no items shouldn't get a header tab/chip or a section.
      return Promise.all(
        cats
          .filter((c) => c.items.length > 0)
          .map(async (c) => ({
            id: c.id,
            name: c.name as Localized,
            items: await Promise.all(
              c.items.map(async (it) => ({
                id: it.id,
                name: it.name as Localized,
                description: (it.description as Localized | null) ?? undefined,
                ingredients: (it.ingredients as string[] | null) ?? [],
                calories: showCalories ? (it.calories ?? undefined) : undefined,
                price: showPrice ? (it.price ?? undefined) : undefined,
                isAvailable: it.isAvailable,
                images: await Promise.all(
                  it.images.map(async (img) => ({
                    src: imgUrl(img.objectKey, 1000),
                    srcSet: imgSrcSet(img.objectKey, SRCSET_WIDTHS),
                    blurDataURL: await blurhashToDataURL(img.blurhash),
                    width: img.width,
                    height: img.height,
                  })),
                ),
              })),
            ),
          })),
      );
    },
    ["public-menu", cafeId, String(showCalories), String(showPrice)],
    { tags: [`menu:${cafeId}`], revalidate: 3600 },
  )();

export async function generateStaticParams() {
  // Pre-render active slugs when the DB is reachable at build. In a Docker image build the DB
  // isn't up — tolerate that and return []: pages then generate on first request via ISR.
  try {
    const cafes = await db.cafe.findMany({ where: { status: "ACTIVE" }, select: { slug: true } });
    return cafes.map((c) => ({ cafeSlug: c.slug }));
  } catch {
    return [];
  }
}

// Per-café SEO/OpenGraph + favicon. Reads the SAME cached café lookup as the page (deduped per
// request), so a settings change that calls revalidateTag("cafe:"+slug) refreshes this too. The
// og:image is built from the café logo (1200×630, no crop); favicon from the per-café upload.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ cafeSlug: string }>;
}): Promise<Metadata> {
  const { cafeSlug } = await params;
  const cafe = await getCafe(cafeSlug);
  if (!cafe) return {};

  const title = cafe.metaTitle?.trim() || cafe.name;
  const description = cafe.metaDescription?.trim() || undefined;
  const ogImage = cafe.logoKey ? imgUrl(cafe.logoKey, 1200, 630, "fit") : undefined;
  const favicon = cafe.faviconKey ? imgUrl(cafe.faviconKey, 64, 64, "fit") : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: cafe.name,
      type: "website",
      locale: "fa_IR",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: cafe.name }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    // Only override the app default favicon when the café uploaded one.
    icons: favicon ? { icon: favicon } : undefined,
  };
}

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ cafeSlug: string }>;
}) {
  const { cafeSlug } = await params;
  const cafe = await getCafe(cafeSlug);
  if (!cafe) notFound();

  const categories = await getMenu(cafe.id, cafe.showCalories, cafe.showPrice);
  const Template = TEMPLATES[cafe.template];
  // Logo is signed server-side (key never reaches the client) and resized "fit" (no crop).
  const logoSrc = cafe.logoKey ? imgUrl(cafe.logoKey, 240, 120, "fit") : null;

  return (
    <ThemeScope template={cafe.template} tokens={cafe.themeTokens}>
      <Template
        cafe={{ name: cafe.name, defaultLocale: cafe.defaultLocale, logoSrc }}
        categories={categories}
      />
    </ThemeScope>
  );
}
