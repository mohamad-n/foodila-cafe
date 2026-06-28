"use server";

import { requireUser, AuthorizationError } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";
import { type ActionResult, zodToActionResult } from "@/lib/action-result";
import { ChangePasswordInput } from "./schema";

/**
 * Change the signed-in user's own password. User-scoped (any authenticated role: SUPER_ADMIN or any
 * café member) — the target is always the session user, never a client-supplied id. Verifies the
 * current password against the stored scrypt hash before writing the new one, and audits the change.
 */
export async function changePassword(raw: ChangePasswordInput): Promise<ActionResult> {
  const parsed = ChangePasswordInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { currentPassword, newPassword } = parsed.data;

  try {
    const sessionUser = await requireUser();

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) return { ok: false, error: "این حساب گذرواژه‌ای ندارد." };

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return { ok: false, fieldErrors: { currentPassword: "گذرواژهٔ فعلی نادرست است." } };
    }

    await db.user.update({
      where: { id: sessionUser.id },
      data: { passwordHash: hashPassword(newPassword) },
    });
    await writeAudit({
      actorId: sessionUser.id,
      action: "user.password_change",
      targetType: "user",
      targetId: sessionUser.id,
    });

    return { ok: true };
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return {
        ok: false,
        error: e.kind === "UNAUTHENTICATED" ? "ابتدا وارد شوید." : "اجازهٔ این کار را ندارید.",
      };
    }
    throw e;
  }
}
