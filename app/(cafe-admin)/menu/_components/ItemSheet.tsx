"use client";

import type { ReactNode } from "react";
import { FormSheet } from "@/components/admin/FormSheet";
import { ItemForm } from "./ItemForm";
import type { CategoryOption } from "../schema";

/** Client launcher: opens the (new) item form in a Sheet. Trigger-based, or controlled via `open`. */
export function ItemSheet({
  cafeId,
  categories,
  defaultCategoryId,
  trigger,
  open,
  onOpenChange,
}: {
  cafeId: string;
  categories: CategoryOption[];
  defaultCategoryId?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <FormSheet title="افزودن آیتم" trigger={trigger} open={open} onOpenChange={onOpenChange}>
      {(close) => (
        <ItemForm
          cafeId={cafeId}
          categories={categories}
          defaultCategoryId={defaultCategoryId}
          onDone={close}
        />
      )}
    </FormSheet>
  );
}
