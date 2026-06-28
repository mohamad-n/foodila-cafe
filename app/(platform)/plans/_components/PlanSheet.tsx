"use client";

import type { ReactNode } from "react";
import { FormSheet } from "@/components/admin/FormSheet";
import { PlanForm } from "./PlanForm";

/** Client launcher: opens the plan form in a Sheet. */
export function PlanSheet({
  plan,
  title,
  trigger,
}: {
  plan?: { id: string; name: string };
  title: string;
  trigger: ReactNode;
}) {
  return (
    <FormSheet title={title} trigger={trigger}>
      {(close) => <PlanForm plan={plan} onDone={close} />}
    </FormSheet>
  );
}
