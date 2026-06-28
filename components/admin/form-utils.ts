"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

/**
 * Apply a Server Action's `ActionResult` to an RHF form: on success toast + run onSuccess
 * (close the Sheet); on failure map `fieldErrors` back onto fields and toast `error`.
 */
export function applyActionResult<T extends FieldValues>(
  form: UseFormReturn<T>,
  res: ActionResult,
  opts: { successMessage: string; onSuccess: () => void },
): void {
  if (res.ok) {
    toast.success(opts.successMessage);
    opts.onSuccess();
    return;
  }
  if (res.fieldErrors) {
    for (const [field, message] of Object.entries(res.fieldErrors)) {
      form.setError(field as Path<T>, { message });
    }
  }
  if (res.error) toast.error(res.error);
}
