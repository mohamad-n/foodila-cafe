import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe base Auth.js config — NO database or Node-only imports, so it can run in
 * middleware (edge). The Credentials provider, DB lookups, and the rich jwt/session
 * callbacks live in lib/auth.ts (Node runtime). See .claude/skills/auth-rbac.
 *
 * The `authorized` callback below is coarse gating used by middleware; the real
 * enforcement is the per-route/per-action guards in lib/auth.ts.
 */

// Authenticated surfaces. Route groups don't appear in the URL, so we match the actual
// top-level segments of (cafe-admin) and (platform). Café slugs must avoid these words.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/menu",
  "/staff",
  "/settings",
  "/cafes",
  "/plans",
  "/users",
];

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // real providers added in lib/auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;
      const isProtected = PROTECTED_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      );
      if (isProtected && !isLoggedIn) return false; // → redirect to signIn page
      return true;
    },
  },
} satisfies NextAuthConfig;
