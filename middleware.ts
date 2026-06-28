import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge instance: verifies the session JWT and applies the `authorized` callback (coarse
// gating). It does NOT import the DB/Credentials provider, so it stays edge-safe.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
