import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { getImpersonatedCafeId } from "@/lib/impersonation";
import type { SessionMembership } from "@/types/next-auth";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Identity lookup uses the base client (User is non-tenant); never trusts client role claims.
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        if (!verifyPassword(password, user.passwordHash)) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // Only on sign-in (`user` present) do we hit the DB to load role + memberships into the token.
      if (user?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            platformRole: true,
            memberships: { select: { cafeId: true, role: true } },
          },
        });
        if (dbUser) {
          token.uid = dbUser.id;
          token.platformRole = dbUser.platformRole ?? null;
          token.memberships = dbUser.memberships.map((m) => ({
            cafeId: m.cafeId,
            role: m.role,
          }));
        }
      }
      return token;
    },
    async session({ session, token }) {
      // The token's app fields are written by the jwt callback above; narrow them on read.
      session.user.id = (token.uid as string | undefined) ?? "";
      session.user.platformRole =
        (token.platformRole as "SUPER_ADMIN" | null | undefined) ?? null;
      session.user.memberships = (token.memberships as SessionMembership[] | undefined) ?? [];
      session.user.impersonating =
        (token.impersonating as { cafeId: string } | null | undefined) ?? null;
      return session;
    },
  },
});

// ---------------------------------------------------------------------------
// Guard helpers (server-only) — start every protected loader / Server Action with one.
// They THROW; Server Actions convert the throw into a user-safe result, loaders/layouts
// typically redirect on `UNAUTHENTICATED`. cafeId always comes from the session, never the URL.
// ---------------------------------------------------------------------------

export type AuthErrorKind = "UNAUTHENTICATED" | "FORBIDDEN";

export class AuthorizationError extends Error {
  constructor(public readonly kind: AuthErrorKind) {
    super(kind);
    this.name = "AuthorizationError";
  }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new AuthorizationError("UNAUTHENTICATED");
  return session.user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.platformRole !== "SUPER_ADMIN") throw new AuthorizationError("FORBIDDEN");
  return user;
}

const RANK = { STAFF: 1, ADMIN: 2, OWNER: 3 } as const;
type CafeRoleName = keyof typeof RANK;

/** Authorize the user for `cafeId` at >= the lowest allowed role. Returns the resolved cafeId + role. */
export async function requireCafeRole(cafeId: string, allowed: CafeRoleName[]) {
  const user = await requireUser();

  // A super-admin may act on a café only while explicitly impersonating that exact café.
  if (user.platformRole === "SUPER_ADMIN" && (await getImpersonatedCafeId(user)) === cafeId) {
    return { cafeId, role: "OWNER" as const, viaImpersonation: true };
  }

  const membership = user.memberships.find((m) => m.cafeId === cafeId);
  const min = Math.min(...allowed.map((r) => RANK[r]));
  if (!membership || RANK[membership.role] < min) {
    throw new AuthorizationError("FORBIDDEN");
  }
  return { cafeId, role: membership.role, viaImpersonation: false };
}
