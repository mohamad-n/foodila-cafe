"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { ACTIVE_CAFE_COOKIE } from "@/lib/active-cafe";

/**
 * Café switcher. Validates that the chosen café is one the signed-in user actually belongs
 * to (server-side, from the session) before storing the preference cookie.
 */
export async function setActiveCafe(formData: FormData) {
  const user = await requireUser();
  const cafeId = z.string().min(1).parse(formData.get("cafeId"));

  if (!user.memberships.some((m) => m.cafeId === cafeId)) {
    throw new Error("Forbidden: not a member of this café.");
  }

  const jar = await cookies();
  jar.set(ACTIVE_CAFE_COOKIE, cafeId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/dashboard");
}
