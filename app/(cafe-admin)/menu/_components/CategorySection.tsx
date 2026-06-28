"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/DataTable";
import type { CategoryOption, MenuCategoryDTO } from "../schema";
import { CategorySheet } from "./CategorySheet";
import { ItemSheet } from "./ItemSheet";
import { CategoryActions } from "./CategoryActions";
import { ItemRow } from "./ItemRow";
import { ItemCard } from "./ItemCard";

export function CategorySection({
  cafeId,
  category,
  options,
}: {
  cafeId: string;
  category: MenuCategoryDTO;
  options: CategoryOption[];
}) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-medium">{category.name.fa}</h2>
          {!category.isActive ? <Badge variant="secondary">غیرفعال</Badge> : null}
        </div>
        {/* Desktop: explicit buttons. «افزودن آیتم» lives here (removed from the footer). */}
        <div className="hidden items-center gap-2 md:flex">
          <ItemSheet
            cafeId={cafeId}
            categories={options}
            defaultCategoryId={category.id}
            trigger={
              <Button size="sm">
                <Plus className="size-4" /> افزودن آیتم
              </Button>
            }
          />
          <CategorySheet
            cafeId={cafeId}
            category={category}
            title="ویرایش دسته"
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="size-4" /> ویرایش
              </Button>
            }
          />
          {/* Remove disabled for now (per request). */}
          <Button variant="ghost" size="sm" className="text-destructive" disabled>
            <Trash2 className="size-4" /> حذف
          </Button>
        </div>

        {/* Mobile: the same actions collapsed into a three-dot dropdown. */}
        <div className="md:hidden">
          <CategoryActions cafeId={cafeId} category={category} options={options} />
        </div>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <DataTable
          headers={["تصویر", "نام", "قیمت", "کالری", "وضعیت", ""]}
          empty="آیتمی در این دسته نیست."
        >
          {category.items.map((item) => (
            <ItemRow key={item.id} item={item} cafeId={cafeId} categories={options} />
          ))}
        </DataTable>
      </div>

      {/* Mobile: item cards */}
      <div className="space-y-2.5 md:hidden">
        {category.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">آیتمی در این دسته نیست.</p>
        ) : (
          category.items.map((item) => (
            <ItemCard key={item.id} item={item} cafeId={cafeId} categories={options} />
          ))
        )}
      </div>
    </div>
  );
}
