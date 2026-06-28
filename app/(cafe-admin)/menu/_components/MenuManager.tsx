"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CategorySection } from "./CategorySection";
import type { CategoryOption, MenuCategoryDTO } from "../schema";

/**
 * Café-admin menu manager: categories sit on top as tabs; selecting one shows only that
 * category's items (its `CategorySection`). Keeps all per-category actions intact.
 */
export function MenuManager({
  cafeId,
  categories,
  options,
}: {
  cafeId: string;
  categories: MenuCategoryDTO[];
  options: CategoryOption[];
}) {
  return (
    <Tabs dir="rtl" defaultValue={categories[0]?.id} className="space-y-4">
      {/* One RTL row, horizontally scrollable (no wrapping) — scrollbar hidden. */}
      <TabsList className="flex h-auto w-full max-w-full justify-start gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <TabsTrigger key={c.id} value={c.id} className="shrink-0">
            {c.name.fa}
            {!c.isActive ? <span className="text-xs text-muted-foreground">(غیرفعال)</span> : null}
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((category) => (
        <TabsContent key={category.id} value={category.id}>
          <CategorySection cafeId={cafeId} category={category} options={options} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
