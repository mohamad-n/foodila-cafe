"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/admin/fields";
import { applyActionResult } from "@/components/admin/form-utils";
import { updateCafeTemplate } from "../actions";
import { TemplateInput } from "../schema";

// Labels for the three public-menu templates (mirrors the platform-admin selector).
const TEMPLATE_OPTIONS = [
  { value: "EDITORIAL", label: "ادیتوریال" },
  { value: "WARM", label: "گرم" },
  { value: "SCANDI", label: "اسکاندی" },
];

export function TemplateSettingsForm({
  cafeId,
  template,
}: {
  cafeId: string;
  template: TemplateInput["template"];
}) {
  const form = useForm<TemplateInput>({
    resolver: zodResolver(TemplateInput),
    defaultValues: { cafeId, template },
  });

  async function onSubmit(values: TemplateInput) {
    const res = await updateCafeTemplate(values);
    applyActionResult(form, res, { successMessage: "قالب ذخیره شد.", onSuccess: () => form.reset(values) });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <SelectField control={form.control} name="template" label="قالب منو" options={TEMPLATE_OPTIONS} />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "در حال ذخیره…" : "ذخیره"}
        </Button>
      </form>
    </Form>
  );
}
