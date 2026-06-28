"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/admin/fields";
import { applyActionResult } from "@/components/admin/form-utils";
import { changePassword } from "./actions";
import { ChangePasswordInput } from "./schema";

const EMPTY: ChangePasswordInput = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordInput),
    defaultValues: EMPTY,
  });

  async function onSubmit(values: ChangePasswordInput) {
    const res = await changePassword(values);
    applyActionResult(form, res, {
      successMessage: "گذرواژه با موفقیت تغییر کرد.",
      onSuccess: () => form.reset(EMPTY),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextField
          control={form.control}
          name="currentPassword"
          label="گذرواژهٔ فعلی"
          type="password"
          dir="ltr"
          autoComplete="current-password"
        />
        <TextField
          control={form.control}
          name="newPassword"
          label="گذرواژهٔ جدید"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          description="حداقل ۸ نویسه. گذرواژه‌ای قوی و یکتا انتخاب کنید."
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="تکرار گذرواژهٔ جدید"
          type="password"
          dir="ltr"
          autoComplete="new-password"
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "در حال ذخیره…" : "تغییر گذرواژه"}
        </Button>
      </form>
    </Form>
  );
}
