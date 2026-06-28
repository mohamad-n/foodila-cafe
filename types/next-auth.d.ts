import type { DefaultSession } from "next-auth";

/** Café membership carried in the session/JWT so guards don't hit the DB per request. */
export type SessionMembership = {
  cafeId: string;
  role: "OWNER" | "ADMIN" | "STAFF";
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      platformRole: "SUPER_ADMIN" | null;
      memberships: SessionMembership[];
      impersonating?: { cafeId: string } | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    platformRole: "SUPER_ADMIN" | null;
    memberships: SessionMembership[];
    impersonating?: { cafeId: string } | null;
  }
}
