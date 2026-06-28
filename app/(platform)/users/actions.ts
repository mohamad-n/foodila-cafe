"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin, AuthorizationError } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { type ActionResult, zodToActionResult } from "@/lib/action-result";

const Input = z.object({
  userId: z.string().min(1),
  superAdmin: z.boolean(),
});

export async function setPlatformRole(raw: {
  userId: string;
  superAdmin: boolean;
}): Promise<ActionResult> {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { userId, superAdmin } = parsed.data;
  try {
    const admin = await requireSuperAdmin();
    // Safety net (the UI hides self-demote): never let an operator strip their own access.
    if (userId === admin.id && !superAdmin) {
      return { ok: false, error: "نمی‌توانید نقش سوپرادمین خودتان را حذف کنید." };
    }

    await db.user.update({
      where: { id: userId },
      data: { platformRole: superAdmin ? "SUPER_ADMIN" : null },
    });
    await writeAudit({
      actorId: admin.id,
      action: superAdmin ? "user.promote" : "user.demote",
      targetType: "user",
      targetId: userId,
    });
    revalidatePath("/users");
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthorizationError) return { ok: false, error: "اجازهٔ این کار را ندارید." };
    throw e;
  }
}
