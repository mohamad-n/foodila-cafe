"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormSheet } from "@/components/admin/FormSheet";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deleteImage } from "../actions";
import type { CategoryOption, MenuItemDTO } from "../schema";
import { ItemForm } from "./ItemForm";
import { ImageUploader } from "./ImageUploader";

/**
 * Per-item actions: a kebab dropdown (edit / remove) shared by the desktop table row and the
 * mobile card. "Edit" opens the item drawer (controlled FormSheet) with image management; "remove"
 * is disabled for now. The sheet is a sibling of the dropdown so it survives the menu closing.
 */
export function ItemActions({
  item,
  cafeId,
  categories,
}: {
  item: MenuItemDTO;
  cafeId: string;
  categories: CategoryOption[];
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="عملیات">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" /> ویرایش
          </DropdownMenuItem>
          {/* Remove disabled for now (per request). */}
          <DropdownMenuItem disabled className="text-destructive">
            <Trash2 className="size-4" /> حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        title="ویرایش آیتم"
        description={item.name.fa}
      >
        {(close) => (
          <div className="space-y-6">
            <ItemForm cafeId={cafeId} categories={categories} item={item} onDone={close} />

            <div className="space-y-2 border-t pt-4">
              <div className="text-sm font-medium">تصاویر</div>
              {item.images.length > 0 ? (
                <ul className="flex flex-wrap gap-3">
                  {item.images.map((img) => (
                    <li key={img.id} className="space-y-1 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.thumbUrl}
                        alt={item.name.fa}
                        width={80}
                        height={80}
                        className="size-20 rounded-md object-cover"
                        style={{ backgroundColor: "hsl(var(--muted))" }}
                      />
                      <ConfirmDialog
                        title="حذف تصویر؟"
                        confirmLabel="حذف"
                        successMessage="تصویر حذف شد."
                        onConfirm={() => deleteImage({ cafeId, id: img.id })}
                        trigger={
                          <Button variant="ghost" size="sm" className="h-7 text-destructive">
                            حذف
                          </Button>
                        }
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">بدون تصویر</p>
              )}
              <ImageUploader cafeId={cafeId} itemId={item.id} />
            </div>
          </div>
        )}
      </FormSheet>
    </>
  );
}
