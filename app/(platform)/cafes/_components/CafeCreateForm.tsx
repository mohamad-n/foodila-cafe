"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/admin/fields";
import { applyActionResult } from "@/components/admin/form-utils";
import { createCafe } from "../actions";
import { CafeCreateInput } from "../schema";

export const TEMPLATE_OPTIONS = [
  { value: "EDITORIAL", label: "ادیتوریال" },
  { value: "WARM", label: "گرم" },
  { value: "SCANDI", label: "اسکاندی" },
];

export function CafeCreateForm({ onDone }: { onDone: () => void }) {
  const form = useForm<CafeCreateInput>({
    resolver: zodResolver(CafeCreateInput),
    defaultValues: {
      name: "",
      slug: "",
      template: "EDITORIAL",
      ownerEmail: "",
      ownerPassword: "",
    },
  });

  async function onSubmit(values: CafeCreateInput) {
    const res = await createCafe(values);
    applyActionResult(form, res, { successMessage: "کافه ساخته شد.", onSuccess: onDone });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextField control={form.control} name="name" label="نام کافه" />
        <TextField control={form.control} name="slug" label="اسلاگ (URL)" dir="ltr" placeholder="my-cafe" />
        <SelectField control={form.control} name="template" label="قالب" options={TEMPLATE_OPTIONS} />
        <TextField
          control={form.control}
          name="ownerEmail"
          label="ایمیل مالک"
          type="email"
          dir="ltr"
          autoComplete="off"
        />
        <TextField
          control={form.control}
          name="ownerPassword"
          label="گذرواژهٔ مالک"
          type="password"
          dir="ltr"
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "در حال ساخت…" : "ساخت کافه"}
        </Button>
      </form>
    </Form>
  );
}
