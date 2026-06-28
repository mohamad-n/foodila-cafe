"use client";

import type { ReactNode } from "react";
import { FormSheet } from "@/components/admin/FormSheet";
import { CategoryForm } from "./CategoryForm";
import type { MenuCategoryDTO } from "../schema";

/** Client launcher: opens the category form in a Sheet. Trigger-based, or controlled via `open`. */
export function CategorySheet({
  cafeId,
  category,
  title,
  trigger,
  open,
  onOpenChange,
}: {
  cafeId: string;
  category?: MenuCategoryDTO;
  title: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <FormSheet title={title} trigger={trigger} open={open} onOpenChange={onOpenChange}>
      {(close) => <CategoryForm cafeId={cafeId} category={category} onDone={close} />}
    </FormSheet>
  );
}
