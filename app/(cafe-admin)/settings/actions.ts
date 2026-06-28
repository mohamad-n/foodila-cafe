"use server";

import { revalidateTag } from "next/cache";
import { requireCafeRole, AuthorizationError } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertCafeKey, deleteObject } from "@/lib/storage";
import { type ActionResult, zodToActionResult } from "@/lib/action-result";
import {
  CafeIdInput,
  LogoInput,
  FaviconInput,
  MetaInput,
  DisplayInput,
  TemplateInput,
} from "./schema";

// Branding + display are café settings → OWNER/ADMIN only (STAFF manages menu content, not settings).
const ROLES = ["OWNER", "ADMIN"] as const;

function authError(e: unknown): ActionResult | never {
  if (e instanceof AuthorizationError) {
    return {
      ok: false,
      error: e.kind === "UNAUTHENTICATED" ? "ابتدا وارد شوید." : "اجازهٔ این کار را ندارید.",
    };
  }
  throw e;
}

/** Set the café logo to a freshly-uploaded object (and clean up the previous one). */
export async function setCafeLogo(raw: { cafeId: string; objectKey: string }): Promise<ActionResult> {
  const parsed = LogoInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { cafeId, objectKey } = parsed.data;
  try {
    await requireCafeRole(cafeId, [...ROLES]);
    assertCafeKey(cafeId, objectKey); // must live under this café's prefix
    const cafe = await db.cafe.findUnique({ where: { id: cafeId }, select: { slug: true, logoKey: true } });
    if (!cafe) return { ok: false, error: "کافه یافت نشد." };

    await db.cafe.update({ where: { id: cafeId }, data: { logoKey: objectKey } });
    if (cafe.logoKey && cafe.logoKey !== objectKey) await deleteObject(cafe.logoKey);
    revalidateTag(`cafe:${cafe.slug}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

/** Remove the café logo (clears the column + deletes the MinIO object). */
export async function removeCafeLogo(raw: { cafeId: string }): Promise<ActionResult> {
  const parsed = CafeIdInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { cafeId } = parsed.data;
  try {
    await requireCafeRole(cafeId, [...ROLES]);
    const cafe = await db.cafe.findUnique({ where: { id: cafeId }, select: { slug: true, logoKey: true } });
    if (!cafe) return { ok: false, error: "کافه یافت نشد." };

    await db.cafe.update({ where: { id: cafeId }, data: { logoKey: null } });
    if (cafe.logoKey) await deleteObject(cafe.logoKey);
    revalidateTag(`cafe:${cafe.slug}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

/** Change which template (layout/theme) the café's public menu renders. */
export async function updateCafeTemplate(raw: TemplateInput): Promise<ActionResult> {
  const parsed = TemplateInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { cafeId, template } = parsed.data;
  try {
    await requireCafeRole(cafeId, [...ROLES]);
    const cafe = await db.cafe.findUnique({ where: { id: cafeId }, select: { slug: true } });
    if (!cafe) return { ok: false, error: "کافه یافت نشد." };

    await db.cafe.update({ where: { id: cafeId }, data: { template } });
    // The public page renders by template; refresh both the cafe lookup and the menu render.
    revalidateTag(`cafe:${cafe.slug}`);
    revalidateTag(`menu:${cafeId}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

/** Toggle whether calories / price are shown on the public menu. */
export async function updateCafeDisplay(raw: DisplayInput): Promise<ActionResult> {
  const parsed = DisplayInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { cafeId, showCalories, showPrice } = parsed.data;
  try {
    await requireCafeRole(cafeId, [...ROLES]);
    const cafe = await db.cafe.findUnique({ where: { id: cafeId }, select: { slug: true } });
    if (!cafe) return { ok: false, error: "کافه یافت نشد." };

    await db.cafe.update({ where: { id: cafeId }, data: { showCalories, showPrice } });
    // Both the cafe lookup and the menu DTO (which gates calories/price) must refresh.
    revalidateTag(`cafe:${cafe.slug}`);
    revalidateTag(`menu:${cafeId}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

/** Update the public menu's SEO / OpenGraph title + description (empty → null = fall back to name). */
export async function updateCafeMeta(raw: MetaInput): Promise<ActionResult> {
  const parsed = MetaInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { cafeId, metaTitle, metaDescription } = parsed.data;
  try {
    await requireCafeRole(cafeId, [...ROLES]);
    const cafe = await db.cafe.findUnique({ where: { id: cafeId }, select: { slug: true } });
    if (!cafe) return { ok: false, error: "کافه یافت نشد." };

    await db.cafe.update({
      where: { id: cafeId },
      data: { metaTitle: metaTitle || null, metaDescription: metaDescription || null },
    });
    revalidateTag(`cafe:${cafe.slug}`); // generateMetadata reads the cached café lookup
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

/** Set the café favicon to a freshly-uploaded object (and clean up the previous one). */
export async function setCafeFavicon(raw: {
  cafeId: string;
  objectKey: string;
}): Promise<ActionResult> {
  const parsed = FaviconInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { cafeId, objectKey } = parsed.data;
  try {
    await requireCafeRole(cafeId, [...ROLES]);
    assertCafeKey(cafeId, objectKey); // must live under this café's prefix
    const cafe = await db.cafe.findUnique({
      where: { id: cafeId },
      select: { slug: true, faviconKey: true },
    });
    if (!cafe) return { ok: false, error: "کافه یافت نشد." };

    await db.cafe.update({ where: { id: cafeId }, data: { faviconKey: objectKey } });
    if (cafe.faviconKey && cafe.faviconKey !== objectKey) await deleteObject(cafe.faviconKey);
    revalidateTag(`cafe:${cafe.slug}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

/** Remove the café favicon (clears the column + deletes the MinIO object). */
export async function removeCafeFavicon(raw: { cafeId: string }): Promise<ActionResult> {
  const parsed = CafeIdInput.safeParse(raw);
  if (!parsed.success) return zodToActionResult(parsed.error);
  const { cafeId } = parsed.data;
  try {
    await requireCafeRole(cafeId, [...ROLES]);
    const cafe = await db.cafe.findUnique({
      where: { id: cafeId },
      select: { slug: true, faviconKey: true },
    });
    if (!cafe) return { ok: false, error: "کافه یافت نشد." };

    await db.cafe.update({ where: { id: cafeId }, data: { faviconKey: null } });
    if (cafe.faviconKey) await deleteObject(cafe.faviconKey);
    revalidateTag(`cafe:${cafe.slug}`);
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}
