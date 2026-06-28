---
name: auth-rbac
description: >
  Authentication and the two-tier authorization model for this SaaS: platform SUPER_ADMIN vs per-café
  OWNER/ADMIN/STAFF, the guard helpers, session shape, and impersonation. ALWAYS consult this skill when
  adding or protecting any café-admin or platform route or Server Action, checking permissions, resolving
  the active café, configuring Auth.js, or implementing super-admin impersonation. Trigger on: "protect
  this route", "who can do X", "role check", "login/session", "super admin", "impersonate", "permissions".
---

# Auth & RBAC

Two tiers. Get them right or tenant isolation is moot.

- **Platform tier** — `User.platformRole === "SUPER_ADMIN"`. Cross-tenant. Operates the `(platform)` surface.
- **Café tier** — `Membership.role` (`OWNER` > `ADMIN` > `STAFF`) scoped to one `cafeId`. Operates `(cafe-admin)`.
- **Public menu** — no auth.

## Auth.js (NextAuth v5) setup (`lib/auth.ts`)

- Prisma adapter, JWT sessions. On sign-in, load the user's `platformRole` and memberships
  (`[{ cafeId, role }]`) into the token so guards don't hit the DB on every call.
- Session type (augment `next-auth`):
  ```ts
  interface SessionUser {
    id: string;
    platformRole: "SUPER_ADMIN" | null;
    memberships: { cafeId: string; role: "OWNER" | "ADMIN" | "STAFF" }[];
    impersonating?: { cafeId: string } | null;
  }
  ```

## Guard helpers (server-only) — use these everywhere

```ts
import "server-only";
import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw unauthorized();
  return session.user;
}

export async function requireSuperAdmin() {
  const u = await requireUser();
  if (u.platformRole !== "SUPER_ADMIN") throw forbidden();
  return u;
}

const RANK = { STAFF: 1, ADMIN: 2, OWNER: 3 } as const;

/** Authorizes the user for a café at >= the lowest allowed role. Returns the resolved cafeId. */
export async function requireCafeRole(cafeId: string, allowed: ("OWNER"|"ADMIN"|"STAFF")[]) {
  const u = await requireUser();
  // super-admin may act on any café only while explicitly impersonating it
  if (u.platformRole === "SUPER_ADMIN" && u.impersonating?.cafeId === cafeId) return { cafeId, role: "OWNER" as const, viaImpersonation: true };
  const m = u.memberships.find((x) => x.cafeId === cafeId);
  const min = Math.min(...allowed.map((r) => RANK[r]));
  if (!m || RANK[m.role] < min) throw forbidden();
  return { cafeId, role: m.role, viaImpersonation: false };
}
```

## Rules of use

- **Never** read the active café from `[cafeSlug]` or a form field for admin actions. Resolve it from
  `memberships` (single café → that one; multiple → an explicit café switcher that sets it in the session).
- Start **every** protected loader and Server Action with the matching guard, then build the scoped
  Prisma client with the returned `cafeId` (see `tenant-isolation`).
- Capability examples: `STAFF` → menu content + availability; `ADMIN` → + staff management;
  `OWNER` → + billing/plan. Encode with `allowed` arrays at the call site; don't sprinkle ad-hoc role `if`s.

## Impersonation (super-admin → café)

- Explicit action `startImpersonation(cafeId)` (super-admin only) sets `session.impersonating = { cafeId }`,
  writes an audit log row (`who`, `cafeId`, `at`), and the UI shows a persistent warning band.
- `stopImpersonation()` clears it. While impersonating, café guards pass for that one café only.
- Audit every impersonation start/stop and every platform mutation.

## Middleware

`middleware.ts` redirects unauthenticated users away from `(cafe-admin)`/`(platform)` and bounces
non-super-admins off `(platform)`. Treat it as coarse gating; the guards above are the real enforcement.

## Checklist

- [ ] Guard runs first in the action/loader.
- [ ] `cafeId` from session, not URL/input.
- [ ] Correct `allowed` roles for the capability.
- [ ] Platform-only paths use `requireSuperAdmin`.
- [ ] Impersonation is explicit, banded, and logged.
