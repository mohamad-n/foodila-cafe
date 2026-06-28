"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/admin/fields";
import { applyActionResult } from "@/components/admin/form-utils";
import { upsertPlan, PlanInput } from "../actions";

export function PlanForm({
  plan,
  onDone,
}: {
  plan?: { id: string; name: string };
  onDone: () => void;
}) {
  const form = useForm<PlanInput>({
    resolver: zodResolver(PlanInput),
    defaultValues: { id: plan?.id, name: plan?.name ?? "" },
  });

  async function onSubmit(values: PlanInput) {
    const res = await upsertPlan(values);
    applyActionResult(form, res, {
      successMessage: plan ? "پلن ذخیره شد." : "پلن افزوده شد.",
      onSuccess: onDone,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextField control={form.control} name="name" label="نام پلن" />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "در حال ذخیره…" : plan ? "ذخیره" : "افزودن پلن"}
        </Button>
      </form>
    </Form>
  );
}
