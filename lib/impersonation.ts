import "server-only";
import { cookies } from "next/headers";

/**
 * Super-admin impersonation is carried in an httpOnly cookie and ONLY honored for SUPER_ADMINs.
 * The guards (requireCafeRole / requireActiveCafe) read it; the café-admin layout shows a banner.
 */
export const IMPERSONATE_COOKIE = "impersonateCafeId";

export async function getImpersonatedCafeId(user: {
  platformRole: "SUPER_ADMIN" | null;
}): Promise<string | null> {
  if (user.platformRole !== "SUPER_ADMIN") return null;
  const jar = await cookies();
  return jar.get(IMPERSONATE_COOKIE)?.value ?? null;
}
