import { Plus } from "lucide-react";
import { requireActiveCafe } from "@/lib/active-cafe";
import { getTenantPrisma } from "@/lib/tenant";
import { imgUrl } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { CategorySheet } from "./_components/CategorySheet";
import { MenuManager } from "./_components/MenuManager";
import type { Localized, MenuCategoryDTO, CategoryOption } from "./schema";

export default async function MenuPage() {
  const { cafe } = await requireActiveCafe();
  const db = getTenantPrisma(cafe.id);

  const rows = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  // JSON columns are typed as JsonValue; narrow to our localized shape at this boundary.
  // Thumbnail URLs are signed here (server-side) — the imgproxy key never reaches the client.
  const categories: MenuCategoryDTO[] = rows.map((c) => ({
    id: c.id,
    name: c.name as Localized,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    items: c.items.map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      name: i.name as Localized,
      description: (i.description as Localized | null) ?? null,
      ingredients: (i.ingredients as string[] | null) ?? [],
      calories: i.calories,
      price: i.price,
      isAvailable: i.isAvailable,
      sortOrder: i.sortOrder,
      images: i.images.map((img) => ({
        id: img.id,
        thumbUrl: imgUrl(img.objectKey, 192, 192),
        blurhash: img.blurhash,
      })),
    })),
  }));

  const options: CategoryOption[] = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">مدیریت منو</h1>
        <CategorySheet
          cafeId={cafe.id}
          title="افزودن دسته"
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> دستهٔ جدید
            </Button>
          }
        />
      </div>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">هنوز دسته‌ای نساخته‌اید.</p>
      ) : (
        <MenuManager cafeId={cafe.id} categories={categories} options={options} />
      )}
    </section>
  );
}
