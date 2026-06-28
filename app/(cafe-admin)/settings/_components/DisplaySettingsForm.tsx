"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SwitchField } from "@/components/admin/fields";
import { applyActionResult } from "@/components/admin/form-utils";
import { updateCafeDisplay } from "../actions";
import { DisplayInput } from "../schema";

export function DisplaySettingsForm({
  cafeId,
  defaults,
}: {
  cafeId: string;
  defaults: { showCalories: boolean; showPrice: boolean };
}) {
  const form = useForm<DisplayInput>({
    resolver: zodResolver(DisplayInput),
    defaultValues: { cafeId, showCalories: defaults.showCalories, showPrice: defaults.showPrice },
  });

  async function onSubmit(values: DisplayInput) {
    const res = await updateCafeDisplay(values);
    applyActionResult(form, res, { successMessage: "ذخیره شد.", onSuccess: () => form.reset(values) });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <SwitchField
          control={form.control}
          name="showCalories"
          label="نمایش کالری"
          description="کالری آیتم‌ها روی منوی عمومی نشان داده شود."
        />
        <SwitchField
          control={form.control}
          name="showPrice"
          label="نمایش قیمت"
          description="قیمت آیتم‌ها روی منوی عمومی نشان داده شود."
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "در حال ذخیره…" : "ذخیره"}
        </Button>
      </form>
    </Form>
  );
}
