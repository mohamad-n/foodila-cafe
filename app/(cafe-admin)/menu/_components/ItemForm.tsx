"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  TextField,
  NumberField,
  TextareaField,
  SelectField,
  SwitchField,
} from "@/components/admin/fields";
import { applyActionResult } from "@/components/admin/form-utils";
import { upsertItem } from "../actions";
import { ItemInput, type CategoryOption, type MenuItemDTO } from "../schema";

export function ItemForm({
  cafeId,
  categories,
  item,
  defaultCategoryId,
  onDone,
}: {
  cafeId: string;
  categories: CategoryOption[];
  item?: MenuItemDTO;
  defaultCategoryId?: string;
  onDone: () => void;
}) {
  const form = useForm<ItemInput>({
    resolver: zodResolver(ItemInput),
    defaultValues: {
      cafeId,
      id: item?.id,
      categoryId: item?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
      nameFa: item?.name.fa ?? "",
      nameEn: item?.name.en ?? "",
      descriptionFa: item?.description?.fa ?? "",
      descriptionEn: item?.description?.en ?? "",
      ingredients: item?.ingredients.join("\n") ?? "",
      calories: item?.calories ?? undefined,
      price: item?.price ?? undefined,
      sortOrder: item?.sortOrder ?? 0,
      isAvailable: item?.isAvailable ?? true,
    },
  });

  async function onSubmit(values: ItemInput) {
    const res = await upsertItem(values);
    applyActionResult(form, res, {
      successMessage: item ? "آیتم ذخیره شد." : "آیتم افزوده شد.",
      onSuccess: onDone,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <SelectField
          control={form.control}
          name="categoryId"
          label="دسته"
          options={categories.map((c) => ({ value: c.id, label: c.name.fa }))}
        />
        <TextField control={form.control} name="nameFa" label="نام (فارسی)" />
        <TextField control={form.control} name="nameEn" label="نام (انگلیسی)" dir="ltr" />
        <TextareaField control={form.control} name="descriptionFa" label="توضیح (فارسی)" />
        <TextareaField control={form.control} name="descriptionEn" label="توضیح (انگلیسی)" dir="ltr" />
        <TextareaField
          control={form.control}
          name="ingredients"
          label="مواد"
          description="هر کدام در یک خط یا با ویرگول."
        />
        <NumberField
          control={form.control}
          name="price"
          label="قیمت (تومان)"
          min={0}
          optional
        />
        <div className="grid grid-cols-2 gap-3">
          <NumberField control={form.control} name="calories" label="کالری" min={0} optional />
          <NumberField control={form.control} name="sortOrder" label="ترتیب" min={0} />
        </div>
        <SwitchField control={form.control} name="isAvailable" label="موجود" />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "در حال ذخیره…" : item ? "ذخیره" : "افزودن آیتم"}
        </Button>
      </form>
    </Form>
  );
}
