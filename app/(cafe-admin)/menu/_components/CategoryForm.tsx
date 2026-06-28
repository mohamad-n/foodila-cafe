"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TextField, NumberField, SwitchField } from "@/components/admin/fields";
import { applyActionResult } from "@/components/admin/form-utils";
import { upsertCategory } from "../actions";
import { CategoryInput, type MenuCategoryDTO } from "../schema";

export function CategoryForm({
  cafeId,
  category,
  onDone,
}: {
  cafeId: string;
  category?: MenuCategoryDTO;
  onDone: () => void;
}) {
  const form = useForm<CategoryInput>({
    resolver: zodResolver(CategoryInput),
    defaultValues: {
      cafeId,
      id: category?.id,
      nameFa: category?.name.fa ?? "",
      nameEn: category?.name.en ?? "",
      sortOrder: category?.sortOrder ?? 0,
      isActive: category?.isActive ?? true,
    },
  });

  async function onSubmit(values: CategoryInput) {
    const res = await upsertCategory(values);
    applyActionResult(form, res, {
      successMessage: category ? "دسته ذخیره شد." : "دسته افزوده شد.",
      onSuccess: onDone,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextField control={form.control} name="nameFa" label="نام (فارسی)" />
        <TextField control={form.control} name="nameEn" label="نام (انگلیسی)" dir="ltr" />
        <NumberField control={form.control} name="sortOrder" label="ترتیب" min={0} />
        <SwitchField control={form.control} name="isActive" label="فعال" />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "در حال ذخیره…" : category ? "ذخیره" : "افزودن دسته"}
        </Button>
      </form>
    </Form>
  );
}
