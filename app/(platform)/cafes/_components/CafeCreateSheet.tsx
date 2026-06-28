"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSheet } from "@/components/admin/FormSheet";
import { CafeCreateForm } from "./CafeCreateForm";

/** Client launcher: opens the café-create form (with owner) in a Sheet. */
export function CafeCreateSheet() {
  return (
    <FormSheet
      title="افزودن کافه"
      description="کافهٔ جدید به همراه کاربر مالک ساخته می‌شود."
      trigger={
        <Button size="sm">
          <Plus className="size-4" /> کافهٔ جدید
        </Button>
      }
    >
      {(close) => <CafeCreateForm onDone={close} />}
    </FormSheet>
  );
}
