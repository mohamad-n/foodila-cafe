"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TextField, TextareaField } from "@/components/admin/fields";
import { applyActionResult } from "@/components/admin/form-utils";
import { updateCafeMeta } from "../actions";
import { MetaInput } from "../schema";

export function MetaSettingsForm({
  cafeId,
  defaults,
}: {
  cafeId: string;
  defaults: { metaTitle: string; metaDescription: string };
}) {
  const form = useForm<MetaInput>({
    resolver: zodResolver(MetaInput),
    defaultValues: {
      cafeId,
      metaTitle: defaults.metaTitle,
      metaDescription: defaults.metaDescription,
    },
  });

  async function onSubmit(values: MetaInput) {
    const res = await updateCafeMeta(values);
    applyActionResult(form, res, { successMessage: "ذخیره شد.", onSuccess: () => form.reset(values) });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextField
          control={form.control}
          name="metaTitle"
          label="عنوان صفحه (Title)"
          description="در تب مرورگر و پیش‌نمایش لینک نمایش داده می‌شود. خالی بگذارید تا نام کافه استفاده شود."
        />
        <TextareaField
          control={form.control}
          name="metaDescription"
          label="توضیحات (Description)"
          rows={3}
          description="توضیح کوتاه برای موتورهای جستجو و پیش‌نمایش لینک در شبکه‌های اجتماعی."
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "در حال ذخیره…" : "ذخیره"}
        </Button>
      </form>
    </Form>
  );
}
