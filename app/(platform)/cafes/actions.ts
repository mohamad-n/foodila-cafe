"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireSuperAdmin, AuthorizationError } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";
import { IMPERSONATE_COOKIE } from "@/lib/impersonation";
import { seedCafeMenu } from "@/lib/seed/import-menu";
import { type ActionResult, zodToActionResult } from "@/lib/action-result";
import { CafeCreateInput, CafeUpdateInput, CafeStatusInput, ImpersonateInput } from "./schema";

function fail(error: string): ActionResult {
  return { ok: false, error };
}
function onAuthError(e: unknown): ActionResult | never {
  if (e instanceof AuthorizationError) return fail("اجازهٔ این کار را ندارید.");
  throw e;
}

export async function createCafe(raw: CafeCreateInput): Promise<ActionResult> {
  const parsed = CafeCreateInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const input = parsed.data;

  try {
    const admin = await requireSuperAdmin();

    if (await db.cafe.findUnique({ where: { slug: input.slug }, select: { id: true } })) {
      return fail("این اسلاگ قبلاً استفاده شده است.");
    }

    const cafe = await db.$transaction(async (tx) => {
      const cafe = await tx.cafe.create({
        data: { name: input.name, slug: input.slug, template: input.template },
      });
      // Create or reuse the owner user, then attach an OWNER membership.
      const owner = await tx.user.upsert({
        where: { email: input.ownerEmail },
        update: {},
        create: { email: input.ownerEmail, passwordHash: hashPassword(input.ownerPassword) },
      });
      await tx.membership.create({
        data: { cafeId: cafe.id, userId: owner.id, role: "OWNER" },
      });
      return cafe;
    });

    await writeAudit({
      actorId: admin.id,
      action: "cafe.create",
      cafeId: cafe.id,
      metadata: { slug: cafe.slug, ownerEmail: input.ownerEmail },
    });
    revalidatePath("/cafes");
    return { ok: true };
  } catch (e) {
    return onAuthError(e);
  }
}

export async function updateCafe(raw: CafeUpdateInput): Promise<ActionResult> {
  const parsed = CafeUpdateInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const input = parsed.data;

  try {
    const admin = await requireSuperAdmin();
    const existing = await db.cafe.findUnique({
      where: { id: input.id },
      select: { slug: true },
    });
    if (!existing) return fail("کافه یافت نشد.");

    if (input.slug !== existing.slug) {
      const clash = await db.cafe.findUnique({ where: { slug: input.slug }, select: { id: true } });
      if (clash) return fail("این اسلاگ قبلاً استفاده شده است.");
    }

    await db.cafe.update({
      where: { id: input.id },
      data: {
        name: input.name,
        slug: input.slug,
        template: input.template,
        planId: input.planId ?? null,
      },
    });

    await writeAudit({ actorId: admin.id, action: "cafe.update", cafeId: input.id });
    // Refresh the public menu (template/name) for old + new slug.
    revalidateTag(`cafe:${existing.slug}`);
    revalidateTag(`cafe:${input.slug}`);
    revalidateTag(`menu:${input.id}`);
    revalidatePath("/cafes");
    return { ok: true };
  } catch (e) {
    return onAuthError(e);
  }
}

export async function setCafeStatus(raw: CafeStatusInput): Promise<ActionResult> {
  const parsed = CafeStatusInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { id, status } = parsed.data;
  try {
    const admin = await requireSuperAdmin();
    const cafe = await db.cafe.update({ where: { id }, data: { status }, select: { slug: true } });
    await writeAudit({ actorId: admin.id, action: "cafe.status", cafeId: id, metadata: { status } });
    revalidateTag(`cafe:${cafe.slug}`);
    revalidatePath("/cafes");
    return { ok: true };
  } catch (e) {
    return onAuthError(e);
  }
}

/**
 * Seed the bundled default menu (categories, items, prices, ingredients, photos) into a café.
 * Idempotent/additive — safe to re-run. Heavy (image processing + uploads); runs synchronously.
 */
export async function seedCafeDefaultMenu(cafeId: string): Promise<ActionResult> {
  if (!cafeId) return fail("شناسهٔ کافه نامعتبر است.");
  try {
    const admin = await requireSuperAdmin();
    const cafe = await db.cafe.findUnique({ where: { id: cafeId }, select: { slug: true } });
    if (!cafe) return fail("کافه یافت نشد.");

    const summary = await seedCafeMenu(cafeId);

    await writeAudit({
      actorId: admin.id,
      action: "cafe.seed_menu",
      cafeId,
      metadata: { ...summary, unmatchedImages: summary.unmatchedImages.join(", ") },
    });
    revalidateTag(`menu:${cafeId}`);
    revalidateTag(`cafe:${cafe.slug}`);
    return { ok: true };
  } catch (e) {
    return onAuthError(e);
  }
}

export async function startImpersonation(cafeId: string): Promise<void> {
  ImpersonateInput.parse({ cafeId });
  const admin = await requireSuperAdmin();
  const cafe = await db.cafe.findUnique({ where: { id: cafeId }, select: { id: true } });
  if (!cafe) throw new Error("Café not found.");

  const jar = await cookies();
  jar.set(IMPERSONATE_COOKIE, cafeId, { httpOnly: true, sameSite: "lax", path: "/" });
  await writeAudit({ actorId: admin.id, action: "impersonation.start", cafeId });
  redirect("/dashboard");
}

export async function stopImpersonation(): Promise<void> {
  const admin = await requireSuperAdmin();
  const jar = await cookies();
  const cafeId = jar.get(IMPERSONATE_COOKIE)?.value ?? null;
  jar.delete(IMPERSONATE_COOKIE);
  await writeAudit({ actorId: admin.id, action: "impersonation.stop", cafeId });
  redirect("/cafes");
}
