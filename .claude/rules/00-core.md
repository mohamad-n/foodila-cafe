# Core rules

These are project truths. Treat them as constraints, not suggestions.

- **One product, three surfaces:** public menu (`(public)/[cafeSlug]`), café admin (`(cafe-admin)`),
  platform admin (`(platform)`). Know which surface you are editing; their auth and caching differ.
- **Multi-tenant, shared schema.** Every tenant-owned row carries `cafeId`. There is no "global menu".
- **RSC-first.** Default to Server Components. Add `"use client"` only for interactivity
  (carousels, forms, toggles). Keep client bundles small — the public menu is image-heavy.
- **Mutations = Server Actions.** Each action: (1) guard authz, (2) Zod-parse input, (3) scoped Prisma
  write, (4) `revalidateTag`. Route Handlers (`app/api/*`) are only for webhooks, health, and presign.
- **Fail loud in dev, safe in prod.** Validate env at boot (`lib/env.ts`); throw on missing config.
- **No premature abstraction.** Prefer lean, targeted code over frameworks-on-frameworks. Add a
  Turborepo split, Redis, or RLS only when a concrete need appears — not "just in case".
- **Definition of done:** `pnpm lint` + `pnpm typecheck` pass; schema changes have a migration;
  new tenant tables include `cafeId` + index; mutations are guarded.

When a request conflicts with these rules, surface the conflict instead of silently working around it.
