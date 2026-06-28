"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin, AuthorizationError } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { type ActionResult, zodToActionResult } from "@/lib/action-result";

// MVP: name only — pricing/limits are out of scope until billing lands.
export const PlanInput = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "نام لازم است."),
});
export type PlanInput = z.infer<typeof PlanInput>;
const IdInput = z.object({ id: z.string().min(1) });

function onAuthError(e: unknown): ActionResult | never {
  if (e instanceof AuthorizationError) return { ok: false, error: "اجازهٔ این کار را ندارید." };
  throw e;
}

export async function upsertPlan(raw: PlanInput): Promise<ActionResult> {
  const parsed = PlanInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const input = parsed.data;

  try {
    const admin = await requireSuperAdmin();
    const plan = input.id
      ? await db.plan.update({ where: { id: input.id }, data: { name: input.name } })
      : await db.plan.create({ data: { name: input.name } });
    await writeAudit({
      actorId: admin.id,
      action: input.id ? "plan.update" : "plan.create",
      targetType: "plan",
      targetId: plan.id,
    });
    revalidatePath("/plans");
    return { ok: true };
  } catch (e) {
    return onAuthError(e);
  }
}

export async function deletePlan(raw: { id: string }): Promise<ActionResult> {
  const parsed = IdInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { id } = parsed.data;
  try {
    const admin = await requireSuperAdmin();
    // Unlink any cafés on this plan first (planId is optional), then delete.
    await db.$transaction([
      db.cafe.updateMany({ where: { planId: id }, data: { planId: null } }),
      db.plan.delete({ where: { id } }),
    ]);
    await writeAudit({ actorId: admin.id, action: "plan.delete", targetType: "plan", targetId: id });
    revalidatePath("/plans");
    return { ok: true };
  } catch (e) {
    return onAuthError(e);
  }
}
