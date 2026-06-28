import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getImpersonatedCafeId } from "@/lib/impersonation";
import type { SessionMembership } from "@/types/next-auth";

/**
 * The café-admin "active café" is a UI preference stored in a cookie, but it is ALWAYS
 * validated against the session's memberships — authorization derives from memberships,
 * never from the cookie. Multiple memberships → the café switcher sets this cookie.
 */
export const ACTIVE_CAFE_COOKIE = "activeCafeId";

export async function getActiveCafeId(memberships: SessionMembership[]): Promise<string | null> {
  const first = memberships[0];
  if (!first) return null;

  const jar = await cookies();
  const preferred = jar.get(ACTIVE_CAFE_COOKIE)?.value;
  if (preferred && memberships.some((m) => m.cafeId === preferred)) {
    return preferred;
  }
  return first.cafeId;
}

export type ActiveCafe = {
  id: string;
  name: string;
  slug: string;
  role: SessionMembership["role"];
};

export async function getActiveCafe(memberships: SessionMembership[]): Promise<ActiveCafe | null> {
  const id = await getActiveCafeId(memberships);
  if (!id) return null;

  const membership = memberships.find((m) => m.cafeId === id);
  const cafe = await db.cafe.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
  if (!cafe || !membership) return null;

  return { id: cafe.id, name: cafe.name, slug: cafe.slug, role: membership.role };
}

/**
 * Guard + resolve for café-admin loaders: requires a signed-in user with an active café.
 * Redirects unauthenticated → /login, and a café-less super-admin → /cafes. Use at the top
 * of (cafe-admin) pages/layouts so each gets the authenticated user + their active café.
 */
export async function requireActiveCafe() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Super-admin impersonation: act as the impersonated café (role OWNER).
  const impersonatedId = await getImpersonatedCafeId(session.user);
  if (impersonatedId) {
    const cafe = await db.cafe.findUnique({
      where: { id: impersonatedId },
      select: { id: true, name: true, slug: true },
    });
    if (cafe) {
      return { user: session.user, cafe: { ...cafe, role: "OWNER" as const }, impersonating: true };
    }
    // stale cookie → fall through to normal resolution
  }

  const cafe = await getActiveCafe(session.user.memberships);
  if (!cafe) {
    redirect(session.user.platformRole === "SUPER_ADMIN" ? "/cafes" : "/login");
  }
  return { user: session.user, cafe, impersonating: false };
}
