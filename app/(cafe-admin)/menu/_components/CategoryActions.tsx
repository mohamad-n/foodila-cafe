"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CategoryOption, MenuCategoryDTO } from "../schema";
import { CategorySheet } from "./CategorySheet";
import { ItemSheet } from "./ItemSheet";

/**
 * Mobile-only kebab dropdown for a category's header actions (add item / edit / remove). Mirrors
 * the desktop button row; the sheets are controlled siblings so they survive the menu closing.
 */
export function CategoryActions({
  cafeId,
  category,
  options,
}: {
  cafeId: string;
  category: MenuCategoryDTO;
  options: CategoryOption[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="عملیات دسته">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setAddOpen(true)}>
            <Plus className="size-4" /> افزودن آیتم
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" /> ویرایش
          </DropdownMenuItem>
          {/* Remove disabled for now (per request). */}
          <DropdownMenuItem disabled className="text-destructive">
            <Trash2 className="size-4" /> حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ItemSheet
        cafeId={cafeId}
        categories={options}
        defaultCategoryId={category.id}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
      <CategorySheet
        cafeId={cafeId}
        category={category}
        title="ویرایش دسته"
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
