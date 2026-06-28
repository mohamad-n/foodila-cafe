"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/admin/fields";
import { applyActionResult } from "@/components/admin/form-utils";
import { updateCafe } from "../actions";
import { CafeUpdateInput } from "../schema";
import { TEMPLATE_OPTIONS } from "./CafeCreateForm";
import type { CafeRowData } from "./CafeRow";

const NO_PLAN = "__none__";

export function CafeEditForm({
  cafe,
  plans,
  onDone,
}: {
  cafe: CafeRowData;
  plans: { id: string; name: string }[];
  onDone: () => void;
}) {
  const form = useForm<CafeUpdateInput>({
    resolver: zodResolver(CafeUpdateInput),
    defaultValues: {
      id: cafe.id,
      name: cafe.name,
      slug: cafe.slug,
      template: cafe.template,
      planId: cafe.planId ?? undefined,
    },
  });

  async function onSubmit(values: CafeUpdateInput) {
    const res = await updateCafe({
      ...values,
      planId: values.planId === NO_PLAN ? undefined : values.planId,
    });
    applyActionResult(form, res, { successMessage: "کافه ذخیره شد.", onSuccess: onDone });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextField control={form.control} name="name" label="نام" />
        <TextField control={form.control} name="slug" label="اسلاگ" dir="ltr" />
        <SelectField control={form.control} name="template" label="قالب" options={TEMPLATE_OPTIONS} />
        <SelectField
          control={form.control}
          name="planId"
          label="پلن"
          placeholder="— بدون پلن —"
          options={[
            { value: NO_PLAN, label: "— بدون پلن —" },
            ...plans.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "در حال ذخیره…" : "ذخیره"}
        </Button>
      </form>
    </Form>
  );
}
