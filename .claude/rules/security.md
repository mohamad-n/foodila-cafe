# Security rules

- **Tenant isolation first.** Read `.claude/skills/tenant-isolation`. Never query tenant data with the
  base Prisma client. A query without a `cafeId` constraint on a tenant table is a defect even if tests pass.
- **Authorize server-side, every time.** Begin every Server Action and protected loader with a guard:
  `requireSuperAdmin()` for platform, `requireCafeRole(cafeId, roles)` for café scope. Never derive
  permissions from client-supplied fields (hidden inputs, headers, query params).
- **Never trust the URL for identity.** The café-admin active tenant comes from the session's
  `Membership`, not from `[cafeSlug]`. `[cafeSlug]` is only for the *public* read-only menu.
- **Validate all input with Zod** at the boundary: form data, `params`, `searchParams`, webhook bodies.
- **Object storage:** uploads via short-lived presigned PUT scoped to a per-café key prefix
  (`cafes/{cafeId}/…`); never expose MinIO root credentials to the client; never proxy bytes through Next.
- **Secrets** live in env only, validated in `lib/env.ts`. Nothing secret in the repo, in client
  components, or in `NEXT_PUBLIC_*`.
- **Impersonation** (super-admin acting as a café) must be explicit, logged (who/when/whichCafe), and
  visibly banded in the UI. Never silently assume another tenant's identity.
- **Rate-limit** auth and presign endpoints. Set security headers (CSP allowing only your MinIO/imgproxy
  origins; fonts are self-hosted via `next/font/local`, so no external font origin is needed). Escape
  nothing by hand — rely on React's default escaping.
