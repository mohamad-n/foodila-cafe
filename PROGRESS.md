# Build Progress — Café Menu SaaS (MVP)

> Single source of truth for the phased build. One phase ≈ one full session.
> This file is the hand-off between sessions. Keep it truthful: update status and
> write the report **before** stopping.

---

## How to continue (read this first, every session)

When the user says **"continue"** (or starts a fresh session):

1. **Read this whole file.** Find the first phase whose status is not `✅ done`.
2. If a phase is `🔄 doing` (interrupted mid-way), resume it; otherwise start the next `⬜ pending` one.
3. **Consult the matching skill(s)** listed under that phase before writing code.
4. Implement **exactly one phase** — its full scope, nothing from later phases.
5. **Verify**: run `pnpm lint && pnpm typecheck` (and `pnpm build` where relevant).
   For schema changes, generate a migration.
6. **Write the report** in that phase's _Report_ section: what was built, files added,
   what was verified (paste key command output), decisions made, and any follow-ups/known gaps.
7. Set the phase status to `✅ done` and tick its checklist items.
8. **Stop and ask the user** whether to continue to the next phase. Do not auto-proceed.

### Hard rules (apply to every phase)
- **pnpm only** — every install, script, lockfile (`pnpm-lock.yaml`), Docker, CI. Never `npm`/`yarn`.
- **Node 24 (project pins 24.18.0 via `.nvmrc`; `engines.node ">=24.0.0"`)** — Prisma 7 needs ≥20.19;
  we standardized on the current LTS (24). Run `nvm use` before any `pnpm` command. The machine's
  default node is older, so each shell must select 24 first (global default left untouched).
- Obey `CLAUDE.md` + `.claude/rules/` + the named skill for each phase.
- **MVP discipline:** build the leanest thing that works end-to-end. Out of scope for now:
  billing/pricing fields, CI/CD + deploy config, Redis (add only when a concrete need appears).
- Tenant isolation, server-side authz, and Zod-at-the-boundary are non-negotiable even in MVP.
- Definition of done for a phase = its checklist ticked **and** lint + typecheck pass.

### Status legend
`⬜ pending` · `🔄 doing` (in progress) · `✅ done` · `⛔ blocked`

---

## Phase index (priority order)

| # | Phase | Status |
|---|-------|--------|
| 1 | Scaffold & tooling | ✅ done |
| 2 | Data model & tenant-scoped Prisma | ✅ done |
| 3 | Auth & RBAC | ✅ done |
| 4 | Café-admin: menu CRUD | ✅ done |
| 5 | Image pipeline | ✅ done |
| 6 | Public menu (templates + ISR) | ✅ done |
| 7 | Platform admin | ✅ done |

### Epic 2 — Design System Overhaul (post-MVP)

> Goal: migrate the whole app to **shadcn/ui**, make every surface **fully responsive**
> (mobile/tablet/desktop), move admin entry forms into **slide-out `Sheet` drawers**, and add an
> **admin-only, extensible theme system** (Light/Dark/Sepia, default Dark). Decisions locked with the
> user: shadcn **everywhere** (incl. rebuilding the public templates on shadcn while preserving their
> bespoke look + per-café `ThemeScope`); **react-hook-form + zodResolver** client-side with the **Server
> Action staying authoritative**; **side `Sheet` on all sizes** (no Vaul). Stay on **Tailwind 3.4**.
> Primary skill for this epic: **design-system** (+ admin-resource, menu-templates, nextjs-conventions).

| # | Phase | Status |
|---|-------|--------|
| 8 | DS foundation — shadcn install + tokens + core components | ✅ done |
| 9 | Admin theme system (Light/Dark/Sepia, extensible) | ✅ done |
| 10 | Responsive admin shell (nav, header, switchers) | ✅ done |
| 11 | Admin forms → `Sheet` drawer + react-hook-form | ✅ done |
| 12 | Admin pages/tables on shadcn (responsive) | ✅ done |
| 13 | Public menu templates rebuilt on shadcn + responsive | ✅ done |
| 14 | Polish — a11y, RTL audit, theme contrast, docs sync | ✅ done |

---

## Phase 1 — Scaffold & tooling
**Status:** ✅ done
**Skills:** nextjs-conventions
**Goal:** A running Next.js App Router app with the full toolchain, so every later phase has solid ground.

**Checklist**
- [x] `pnpm` Next.js (App Router) + TypeScript `strict`; `pnpm-lock.yaml` present.
- [x] Tailwind configured RTL-aware (`dir="rtl"`, `lang="fa"`), Vazirmatn font wired, logical-property usage.
- [x] Design tokens as CSS variables scaffold (`app/globals.css` `:root` tokens + Tailwind color mapping).
- [x] Zod installed; `lib/env.ts` validates env at boot and throws on missing config.
- [x] Prisma installed + initialized, `lib/db.ts` singleton (no models yet — that's Phase 2).
- [x] ESLint + Prettier; `pnpm lint`, `pnpm typecheck`, `pnpm build` all pass.
- [x] `docker-compose.yml` for local: postgres + minio + imgproxy (next runs on host in dev).
- [x] `.env.example` documenting every env var; `.gitignore` covers `node_modules`, `.next`, `.env`.
- [x] Route-group skeleton: `(public)`, `(cafe-admin)`, `(platform)` groups with placeholder pages.

**Verify:** `pnpm install && pnpm lint && pnpm typecheck && pnpm build` clean.

**Report:** _(2026-06-26)_
Scaffolded manually (not `create-next-app`, which would have conflicted with the existing
`CLAUDE.md` / `.claude/` / `assets/`). Stack installed via **pnpm**: Next 15.5.19, React 19.2,
TypeScript 5.9 (`strict` + `noUncheckedIndexedAccess`), Tailwind 3.4, Prisma 6.19, Zod 3.25.

Files added:
- Tooling: `package.json` (pnpm-only via `preinstall: npx only-allow pnpm`, `packageManager` pinned,
  `pnpm.onlyBuiltDependencies` allows prisma/sharp native builds), `tsconfig.json`, `next.config.ts`
  (`outputFileTracingRoot` pinned — see gotcha), `.eslintrc.json`, `.prettierrc.json`/`.prettierignore`,
  `.npmrc`, `.gitignore`, `next-env.d.ts`.
- Styling: `postcss.config.mjs`, `tailwind.config.ts` (token→color mapping, Vazirmatn font var),
  `app/globals.css` (Étude dark tokens + `prefers-reduced-motion` reset).
- App: `app/layout.tsx` (`lang="fa" dir="rtl"`, Vazirmatn via `next/font/google`), `app/page.tsx`,
  and placeholders `(public)/[cafeSlug]/page.tsx`, `(cafe-admin)/dashboard/page.tsx`,
  `(platform)/cafes/page.tsx`.
- Lib: `lib/env.ts` (Zod env, DB required / storage+auth optional until their phases), `lib/db.ts`
  (base Prisma singleton, `import "server-only"`), `lib/format.ts` (`faNum`).
- Infra: `docker-compose.yml` (postgres 16 + minio + imgproxy, healthchecks, dev creds matching env),
  `.env.example` + a gitignored `.env` with local-dev defaults.
- Prisma: `prisma/schema.prisma` — datasource + generator only (models in Phase 2).

**Verified:**
- `pnpm install` → ok; `prisma generate` ran; sharp/prisma engine native builds approved + built.
- `pnpm typecheck` → clean. `pnpm lint` → "No ESLint warnings or errors".
- `pnpm build` → exit 0, 6 pages. Routes: `/`, `/dashboard`, `/cafes` static (○);
  `/[cafeSlug]` dynamic (ƒ) — expected, it gets `generateStaticParams` + ISR in Phase 6.
- `docker compose config` → valid (services not started this session).

**Decisions / gotchas (carry forward):**
- Tailwind **v3** (not v4) for config-file stability; revisit only if a concrete need appears.
- A stray `~/pnpm-lock.yaml` made Next mis-detect the workspace root → pinned `outputFileTracingRoot`
  in `next.config.ts`. (Cleaning up that home-dir lockfile would also resolve it.)
- `pnpm.onlyBuiltDependencies` is required under pnpm v10 (build scripts are blocked by default).
- `next lint` warns it's deprecated (removed in Next 16). Fine for now; migrate to ESLint CLI if/when
  we bump to Next 16.
- `pnpm test` is a placeholder (exits 0) — a real test runner is deferred to a later phase.
- Not yet done (by design): Prisma models/migrations (P2), auth/guards (P3), `lib/tenant.ts` (P2).

---

## Phase 2 — Data model & tenant-scoped Prisma
**Status:** ✅ done
**Skills:** prisma-data-model, tenant-isolation
**Goal:** The canonical schema + the scoped client that makes tenant isolation the default.

**Checklist**
- [x] Models: `Cafe`, `User`, `Membership`, `Category`, `Item`, `ItemImage`, `Plan` (minimal, no price).
- [x] Enums: `PlatformRole`, `CafeRole (OWNER|ADMIN|STAFF)`, `CafeStatus`, `MenuTemplate (WARM|SCANDI|EDITORIAL)`.
- [x] Every tenant-owned table carries `cafeId` + a `cafeId`-leading index; `onDelete: Cascade` FKs.
- [x] `Cafe.template` (default EDITORIAL) + `Cafe.themeTokens` (JSON) for per-café theming.
- [x] First migration generated and applied (`20260626173834_init`).
- [x] `lib/tenant.ts` — `getTenantPrisma(cafeId)` scoped client; documented as the only path to tenant data.
- [x] Seed script (`pnpm db:seed`): café + owner/staff/super-admin users + 3 categories / 7 items.

**Verify:** `pnpm prisma migrate dev`, seed populates, runtime isolation proof, lint + typecheck + build pass.

**Report:** _(2026-06-26)_
Schema written per the prisma-data-model skill (canonical sketch), with `createdAt`/`updatedAt` added to
the menu models per the stated timestamp convention. Enum is `CafeRole` (skill's canonical name; the
Phase-2 checklist's "MembershipRole" was a placeholder — corrected to match the skill).

Files added/changed:
- `prisma/schema.prisma` — full model set + enums; tenant models (`Membership`, `Category`, `Item`,
  `ItemImage`) each have `cafeId` + composite `@@index([cafeId, …])`; i18n as JSON `{ fa, en? }`;
  `ingredients` JSON `string[]`; soft toggles (`isActive`/`isAvailable`).
- `prisma/migrations/20260626173834_init/` — generated + applied against local Postgres.
- `lib/tenant.ts` — `getTenantPrisma(cafeId)` via Prisma `$extends`: injects `cafeId` on
  create/createMany, constrains `where` on reads + update/delete + upsert. `TENANT_MODELS` set kept in
  sync with the schema. Written **without `any`** (typed `MutableArgs` view) to satisfy the TS rule.
- `lib/password.ts` — dependency-free scrypt `hashPassword`/`verifyPassword` (Node `crypto`). No
  `server-only` marker so the seed can import it; Auth.js credentials will reuse it in Phase 3.
- `prisma/seed.ts` — idempotent (upserts); own `PrismaClient` (can't import `server-only` lib/db).
  Seeds café "darya", users owner@/staff@darya.cafe + admin@platform.local (all `password123`).
- `package.json` — added `tsx` (dev), `"prisma".seed` config, `db:seed` script, `esbuild` to
  `onlyBuiltDependencies`.
- `docker-compose.yml` + `.env`/`.env.example` — **host ports remapped** (postgres 5544, minio
  9300/9301, imgproxy 8800) because 5432/5433/8080/9000 were all taken by other local containers.

**Verified:**
- `prisma validate` ok; `prisma migrate dev` applied; `pnpm db:seed` →
  `{ cafes: 1, users: 3, memberships: 2, categories: 3, items: 7 }`.
- **Runtime tenant-isolation proof** (throwaway script, since deleted): scoped `create` injected the
  correct `cafeId`; café A saw only its 3 categories, café B only its 1 — no cross-tenant leak →
  "ISOLATION OK". (Ran under `tsx --conditions=react-server` so `server-only` didn't throw in node.)
- `pnpm typecheck` clean · `pnpm lint` clean · `pnpm build` exit 0.

**Decisions / gotchas (carry forward):**
- IDE Prisma extension flags `datasource.url` as a **Prisma 7** error — false positive; project pins
  Prisma **6.19** where `url` is correct (`prisma validate` confirms). If/when we bump to Prisma 7,
  migrate the datasource URL + `package.json#prisma` seed config into a `prisma.config.ts` (CLI already
  warns the `package.json#prisma` key is deprecated for v7).
- `lib/db.ts`/`lib/tenant.ts` carry `import "server-only"`, so plain node/tsx can't import them — seed
  and scripts must instantiate their own `PrismaClient` (or run with `--conditions=react-server`).
- Local DB now lives on **port 5544** — `docker compose up -d postgres` then `pnpm db:seed` to rebuild.
- Auth tables (Account/Session/VerificationToken) intentionally NOT added — JWT-session credentials
  auth in Phase 3 doesn't need them; add only if we introduce the email/magic-link provider.

**Addendum (2026-06-26) — upgraded Prisma 6 → 7** (requested, to clear v6 deprecation warnings):
- **Node bumped to 24.18.0** (`.nvmrc` + `engines.node ">=24.0.0"`, `@types/node ^24`) — Prisma 7
  refuses Node < 20.19; standardized on current LTS (24). Native modules (sharp/esbuild/prisma engines)
  rebuilt for the Node 24 ABI on reinstall. **Run `nvm use` before any pnpm command** (global default
  left untouched). _(Briefly ran on 22.19 mid-upgrade, then moved to 24.18 — gates re-verified on 24.)_
- Deps: `@prisma/client`/`prisma` → ^7, added `@prisma/adapter-pg` + `pg` (+ `@types/pg`) driver
  adapter and `dotenv`. Added `esbuild` already in `onlyBuiltDependencies`.
- New **`prisma.config.ts`** (project root) holds the CLI `datasource.url` (`env("DATABASE_URL")`) and
  the `migrations.seed` command — replaces both the schema `datasource.url` and the deprecated
  `package.json#prisma` key (both removed).
- schema.prisma: generator switched `prisma-client-js` → **`prisma-client`** with
  `output = "../lib/generated/prisma"`; datasource keeps `provider` only (no `url`). The generated
  client is gitignored + ignored by eslint/prettier.
- Import path changed `@prisma/client` → **`@/lib/generated/prisma/client`** (lib/db.ts) /
  `../lib/generated/prisma/client` (seed). `lib/db.ts` now instantiates
  `new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) })`; seed does the
  same with its own client.
- `next.config.ts`: `serverExternalPackages: ["pg", "@prisma/adapter-pg"]`.
- Re-verified end-to-end on Node 22.19: `prisma validate` (no deprecation warnings), `migrate status`
  "up to date" (the v6 `init` migration is unchanged + compatible), `pnpm db:seed` ok,
  typecheck + lint + build all green. **No data migration needed** — schema SQL is identical.

---

## Phase 3 — Auth & RBAC
**Status:** ✅ done
**Skills:** auth-rbac
**Goal:** Sign-in plus the two-tier guard model every protected route/action depends on.

**Checklist**
- [x] Auth.js (NextAuth v5, `5.0.0-beta.31`); credentials provider; JWT sessions. _(No Prisma adapter —
      see decision below; credentials + JWT don't use it and we deliberately have no Account/Session tables.)_
- [x] Session shape carries `platformRole` + the user's memberships (cafeId + role).
- [x] Guards in `lib/auth.ts`: `requireUser()`, `requireSuperAdmin()`, `requireCafeRole(cafeId, roles[])`.
- [x] Active-café resolution from `Membership` (never from URL); café switcher (cookie-based) when >1.
- [x] Minimal login page + sign-out; protected layouts redirect unauthenticated/unauthorized users.
- [x] `import "server-only"` on auth/db modules; edge/Node split keeps DB out of middleware.

**Verify:** real login flow over HTTP (unauth redirect → CSRF → credentials → protected access) + RBAC
boundaries; lint + typecheck + build pass.

**Report:** _(2026-06-26)_
NextAuth v5 with the **edge/Node split** required for credentials + middleware:
- `auth.config.ts` (root, **edge-safe**, no DB) — `pages`, JWT strategy, and the coarse `authorized`
  callback that gates a list of protected top-level segments. Used by `middleware.ts`.
- `lib/auth.ts` (**Node**, `server-only`) — `NextAuth({...})` with the Credentials provider (Zod-parses
  input, looks up user via base client, `verifyPassword` from lib/password). `jwt` callback loads
  `platformRole` + memberships into the token **once on sign-in**; `session` callback exposes them.
  Also exports the guard helpers + `AuthorizationError`.
- `app/api/auth/[...nextauth]/route.ts` — mounts `handlers` (`GET`/`POST`).
- `middleware.ts` — edge `NextAuth(authConfig).auth`, matcher excludes `api`/`_next`/static.
- `types/next-auth.d.ts` — augments `Session` (works) and `JWT` (didn't apply in beta.31, so the
  `session` callback reads token fields via explicit narrowing casts — safe, we write them ourselves).
- `lib/active-cafe.ts` — `getActiveCafe(memberships)`: cookie preference **always validated against
  session memberships**. `app/(cafe-admin)/actions.ts` `setActiveCafe` (switcher) re-checks membership.
- Surfaces: `app/login` (page + `LoginForm` client comp + `actions.ts` authenticate/logout),
  `(cafe-admin)/layout.tsx` (requires membership; resolves active café; header + switcher + sign-out;
  super-admin w/o café → `/cafes`), `(platform)/layout.tsx` (requires `SUPER_ADMIN`, else → `/dashboard`).
  Dashboard now shows live category/item counts via `requireCafeRole` + `getTenantPrisma` (full stack);
  `/cafes` lists all cafés via base client behind `requireSuperAdmin`.
- `lib/env.ts`: `AUTH_SECRET` promoted to **required**.

**Verified (runtime, prod `next start` on :3000, real HTTP):**
- Unauth `/dashboard` & `/cafes` → `307 → /login?callbackUrl=…`; public `/darya` → `200` (no auth).
- CSRF (64-char token) → POST credentials (correct pw) → `302` + **session cookie set** →
  authenticated `/dashboard` → `200`, renders داشبورد with the scoped counts.
- **Wrong password** → `302`, **no session cookie**.
- **RBAC:** café OWNER hitting `/cafes` → `307 → /dashboard`; SUPER_ADMIN → `/cafes` `200` (lists
  `darya`), and SUPER_ADMIN `/dashboard` (no membership) → `307 → /cafes`.
- `pnpm typecheck` · `lint` · `build` all green (7 routes + Middleware 87 kB). Server stopped after.

**Decisions / gotchas (carry forward):**
- **No Prisma adapter** (deviates from the skill's wording): credentials + JWT sessions don't use one,
  and Phase 2 intentionally omitted Account/Session/VerificationToken. Add the adapter + those tables
  only if we introduce OAuth or the email/magic-link provider.
- **JWT type augmentation doesn't apply in next-auth beta.31** → token reads use narrowing casts in the
  `session` callback. Revisit if a stable v5 fixes the augmentation.
- next-auth pulls a **jose/edge-runtime build warning** in middleware — non-fatal (build compiles).
- Route groups have no URL prefix, so middleware gates an explicit `PROTECTED_PREFIXES` list in
  `auth.config.ts`; **café slugs must avoid** those words (`dashboard`, `cafes`, `login`, `menu`,
  `staff`, `settings`, `plans`, `users`). Add new admin segments to that list. Layout guards remain
  the authoritative enforcement.
- Impersonation is modeled in the session/guards (`impersonating`) but the start/stop actions + UI band
  are deferred to Phase 7 (platform surface) per the skill.

---

## Phase 4 — Café-admin: menu CRUD
**Status:** ✅ done
**Skills:** admin-resource, tenant-isolation, nextjs-conventions
**Goal:** A café can manage its own menu content end-to-end.

**Checklist**
- [x] Category CRUD (create/edit/delete) using the admin-resource pattern.
- [x] Item CRUD (name fa/en, description fa/en, ingredients, calories, availability toggle, category, ordering).
      _(No **price** — corrected: all 3 reference templates are price-less + calorie-forward, and the `Item`
      schema has no price field. The "price" in this checklist was a stray note; pricing stays out of scope.)_
- [x] Server Actions in colocated `actions.ts`: guard → Zod parse → scoped write → `revalidateTag("menu:"+cafeId)`.
- [x] Shared admin primitives under `components/admin/` (`DataTable`) + `components/ui/` (`form`, `styles`).
- [x] Dashboard shows the active café (counts); café switcher works (built in Phase 3, layout refactored).

**Verify:** read path over real HTTP (guard → scoped read → render seeded menu); scoped create/update/delete
+ cross-tenant rejection proven; lint + typecheck + build pass.

**Report:** _(2026-06-26)_
Built the menu manager on `/menu` per the admin-resource recipe (café-admin surface, tenant-scoped):
- `app/(cafe-admin)/menu/schema.ts` — Zod `CategoryInput`/`ItemInput`/`IdInput`/`ToggleInput` with
  checkbox/optional-string/optional-int/sortOrder preprocessors; serializable DTOs (`MenuCategoryDTO`,
  `MenuItemDTO`, `CategoryOption`) shared RSC→client.
- `app/(cafe-admin)/menu/actions.ts` — `upsertCategory`, `deleteCategory`, `upsertItem`, `deleteItem`,
  `toggleItemAvailability`. Every one: **safeParse → requireCafeRole(cafeId,[OWNER,ADMIN,STAFF]) →
  getTenantPrisma → write → revalidateTag(`menu:${cafeId}`)**. Upserts return user-safe `FormState`
  (guard throws mapped via `authError`); delete/toggle are plain form actions.
- Client forms (`_components/`): `CategoryForm`, `ItemForm` (both create+edit via `useActionState`),
  `ItemRow` (display row + availability toggle + expand-to-edit), `DeleteButton` (confirm + form).
- `components/ui/form.tsx` (`Field`/`SubmitButton`/`FormMessage`), `components/ui/styles.ts`,
  `components/admin/DataTable.tsx`.
- `page.tsx` — `requireActiveCafe()` → scoped `category.findMany({ include: items })` → DTO map → render
  per-category tables with inline item editing + add forms.
- Refactor: added `requireActiveCafe()` to `lib/active-cafe.ts` (guard+resolve helper); `(cafe-admin)`
  layout + dashboard now use it; layout got a داشبورد/منو nav.

**Verified:**
- **Read over HTTP** (prod `next start`): unauth `/menu` → `307 → /login`; authed `/menu` → `200`
  rendering all seeded categories + items (نوشیدنی گرم/اسپرسو/کاپوچینو/دسر/چیزکیک …) — full
  guard → scoped read → DTO → render path.
- **Scoped mutations** (throwaway smoke, deleted): create injects `cafeId`; scoped update applies;
  **cross-tenant update blocked** (P2025) & cross-tenant `deleteMany` count 0; victim survives; legit
  delete works → "MUTATION ISOLATION OK".
- `pnpm typecheck` · `lint` · `build` green (`/menu` route added).

**Decisions / gotchas (carry forward):**
- **Scoped `create` types still require `cafeId`** even though the extension injects it at runtime → we
  pass the session-derived `cafeId` in create `data` (`{ ...data, cafeId }`); the extension force-overrides
  it to the bound value, so isolation holds. `update` data omits it.
- **No price field** anywhere (see above) — menus are calorie-forward by design.
- Server-Action mutations weren't driven over raw HTTP (Next's action POST protocol is brittle to script);
  instead the guard (Phase 3), scoped read (HTTP here), and scoped write/isolation (DB smoke) are each
  verified directly. A UI/integration test belongs in the deferred test phase.
- **Ad-hoc `tsx` scripts now need `import "dotenv/config"`** — Prisma 7's client no longer auto-loads
  `.env` (the app + seed load it explicitly; bare scripts don't).
- `details/summary` used for "add item" (no-JS friendly); inline edit uses a small client toggle.

---

## Phase 5 — Image pipeline
**Status:** ✅ done
**Skills:** image-pipeline, tenant-isolation
**Goal:** Real menu photos: browser→MinIO upload, blurhash, imgproxy delivery.

**Checklist**
- [x] Presigned PUT route scoped to `cafes/{cafeId}/items/{itemId}/…`; never proxy bytes through Next.
- [x] Client upload widget (direct to MinIO) wired into the Item editor; rate-limited presign.
- [x] On upload: compute dimensions + blurhash server-side, write `ItemImage` via scoped client, revalidate.
- [x] `lib/storage.ts` (presign/get/delete) + `lib/image.ts` (signed imgproxy URL builder + blurhash decode).
- [x] imgproxy responsive AVIF/WebP delivery + blurhash placeholder helper. **Deviation:** render
      **server-signed `<img srcSet>`**, NOT a client `next/image` loader (see decision below).

**Verify:** presign over HTTP (auth + scope); full presign→PUT→imgproxy→blurhash round-trip; thumbnail
renders + served by imgproxy; lint + typecheck + build pass.

**Report:** _(2026-06-26)_
Infra (docker-compose): brought **minio + imgproxy** online (+ a one-shot `createbuckets` mc init that
makes the `cafe-menu` bucket; fixed the minio healthcheck to hit `/minio/health/live`). imgproxy has
WebP/AVIF detection on and `ALLOWED_SOURCES=s3://`. Host ports: minio 9300/9301, imgproxy 8800.
- `lib/storage.ts` — one S3 client (forcePathStyle for MinIO); `presignPut`, `getObjectBuffer`,
  `deleteObject`, `assertCafeKey` (key must start with `cafes/{cafeId}/`).
- `lib/image.ts` — `imgUrl(key,w,h)` builds an **HMAC-signed** imgproxy URL (base64url source +
  `rs:fill`/`g:sm`), `imgSrcSet`, `blurhashToDataURL` (blurhash→PNG dataURL via sharp). `server-only`.
- `lib/rate-limit.ts` — in-memory fixed-window limiter (Redis later).
- `app/api/presign/route.ts` — POST, rate-limited by IP, `requireCafeRole`, content-type allowlist →
  `{ url, key }` under the café+item prefix.
- Menu actions: `attachImage({cafeId,itemId,objectKey})` (guard → assertCafeKey → verify item is the
  café's → sharp probe + blurhash → scoped `itemImage.create` → revalidate) and `deleteImage`
  (scoped delete + `deleteObject`).
- Client `ImageUploader` (presign → PUT to MinIO → `attachImage`) wired into `ItemRow`'s edit panel
  with thumbnail grid + per-image delete. Menu page now loads `images` and builds **server-signed**
  thumbnail URLs (key never reaches the client). `MenuItemDTO.images` added.
- `lib/env.ts`: `MINIO_*` + `IMGPROXY_*` promoted to required (IMGPROXY key/salt validated as hex).

**Verified:**
- **Round-trip smoke** (deleted): presigned PUT 200 → server read-back → blurhash + blurDataURL →
  **signed imgproxy URL 200** (resized image) → "IMAGE PIPELINE OK".
- **Presign route over HTTP**: unauth → `401`; authed owner → `200` with key scoped to
  `cafes/{cafeId}/items/{itemId}/…`; PUT to the issued URL → `200`.
- **Attach→render→serve**: attached a real image to a seeded item (scoped `ItemImage` write); `/menu`
  renders a server-signed thumbnail; imgproxy serves it **`200`** at 192×192 and 400×0 (confirmed in
  imgproxy logs). Test image then deleted (seed clean).
- `pnpm typecheck` · `lint` · `build` green (`/api/presign` route added).

**Decisions / gotchas (carry forward):**
- **`next/image` client loader is incompatible with signed imgproxy** (the loader runs in the browser
  and would leak `IMGPROXY_KEY`). So we **sign URLs server-side and render `<img srcSet>`** — same
  responsive AVIF/WebP outcome, secret stays server-side. `imgUrl`/`imgSrcSet`/`blurhashToDataURL` are
  the building blocks the Phase 6 menu will use (blurhash LQIP under the photo).
- **Skill bug found:** the snippet's `toBuffer({ resolveWithObjectInfo: true })` is wrong — sharp's
  option is **`resolveWithObject: true`** (caught by the smoke). Used the correct one.
- imgproxy AVIF/WebP is **Accept-header driven** — serving is proven (returned jpeg for flat test
  images/curl); real browsers negotiating `image/avif` get AVIF.
- **Presigned PUT can't enforce max upload size** (only content-type) — fine for MVP; for hard limits
  switch to a POST policy or check size client-side. Noted.
- Rate-limit is **in-memory/single-instance** — moves to Redis when we scale (redis rule).
- Debugging note: scraping image URLs from server HTML hits the **escaped RSC payload** copy (adds a
  trailing `\`) — not a real signature failure; the rendered `<img src>` is valid.

---

## Phase 6 — Public menu (templates + ISR)
**Status:** ✅ done
**Skills:** menu-templates, data-fetching, styling-rtl
**Goal:** The customer-facing menu — the product's heart — static, fast, themeable.

**Checklist**
- [x] `app/(public)/[cafeSlug]/` with `generateStaticParams` over active slugs; ISR + tag revalidation.
- [x] `components/menu/`: `types.ts`, shared `core/` (ImageCarousel, FullscreenViewer, ItemDetailContent,
      ThemeScope, faNum, + MenuPhoto, DetailSheet), `registry.ts` (`MenuTemplate → dynamic()`).
- [x] **Editorial** template — faithful port of the reference (chips + snap feed + takeover + pointer-drag
      carousel + fullscreen).
- [x] **Warm + Scandi** templates — implemented as working layouts (pills+list / tabs+grid) sharing the
      core via `DetailSheet`. _Simpler than the reference HTML; can be refined later (tracked follow-up)._
- [x] Per-café theming via `ThemeScope` (token allow-list validation); Persian digits; reduced-motion.
- [x] Cached reads tagged `menu:{cafeId}` / `cafe:{slug}`; page is SSG + ISR (not per-request SSR).

**Verify:** `/[cafeSlug]` renders over HTTP (no auth); template selection; imgproxy images; tag revalidation;
lint + typecheck + build pass.

**Report:** _(2026-06-27)_
Ported the multi-template public menu per the menu-templates skill.
- `components/menu/types.ts` — `MenuTemplateProps` etc. **Adaptation:** template-facing `MenuImage` carries
  render-ready `src`/`srcSet`/`blurDataURL` (built + signed server-side), NOT `objectKey` — because imgproxy
  signing must stay server-side (Phase 5). The page builds these; templates stay client-only.
- Shared `core/`: `ThemeScope` (server; `data-template` + validated `themeTokens` CSS vars), `MenuPhoto`
  (blurhash LQIP behind a signed `<img>`, SSR/no-JS friendly), `ImageCarousel` + `FullscreenViewer`
  (pointer-drag/snap ports; track `dir="ltr"`), `ItemDetailContent`, `DetailSheet`, `faNum`.
- `templates/Editorial.tsx` (faithful), `templates/Warm.tsx`, `templates/Scandi.tsx`; `registry.ts`
  code-splits each via `next/dynamic` (SSR on). `menu.css` — token blocks + shared primitives + per-template
  layout scoped by `[data-template]` (a dedicated stylesheet for the immersive Étude design; admin stays Tailwind).
- `app/(public)/layout.tsx` imports `menu.css` + sets viewport (zoom kept for a11y). `app/(public)/[cafeSlug]/page.tsx`:
  `generateStaticParams` over ACTIVE slugs, `revalidate=3600`, `getCafe`/`getMenu` via `unstable_cache`
  (tags `cafe:{slug}` / `menu:{cafeId}`) — `revalidateTag` from the Phase 4 admin actions refreshes it.
- `.eslintrc.json`: `@next/next/no-img-element` off for `components/menu/**` (signed-URL `<img>`).
  `tsconfig.json`: excludes throwaway `prisma/_*.ts`.

**Verified (runtime, prod `next start`):**
- `GET /darya` (NO auth) → `200`, Editorial markup (`data-template="editorial"`, café name, chips, category +
  item names, 3 snap-feed sections), and a signed imgproxy `<img>` serving `200`.
- **Template selection:** a WARM café renders `data-template="warm"` + warm card layout on-demand.
- **SSG/ISR:** build shows `● /[cafeSlug]` (revalidate 1h); seed slug pre-rendered.
- **Tag revalidation:** add an item → public page stays cached (3); `revalidateTag("menu:"+cafeId)` → refreshes
  to 4 on the first poll. Confirmed against an uncached ground-truth read (DB 3→4).
- `pnpm typecheck` · `lint` · `build` green. Temp test route + smokes removed; seed restored (0 images).

**Decisions / gotchas (carry forward):**
- **`next/image` not used for menu photos** (consistent with Phase 5) — server-signed `<img srcSet>` +
  blurhash LQIP. `imgUrl`/`imgSrcSet`/`blurhashToDataURL` build the data inside the cached loader.
- **`blurDataURL` is computed (sharp) inside `unstable_cache`** — once per revalidation, not per request.
- **Test gotcha that cost real time:** a temp route under `app/api/_revalidate/` silently 404'd —
  **Next treats `_`-prefixed folders as private (non-routed)**. Renaming fixed it; the app's revalidation was
  correct all along. (Lesson: never name a route folder with a leading underscore.)
- **Warm/Scandi are simplified** vs the bundled reference HTML — functional + themed, but a faithful port of
  their exact chrome is a nice-to-have follow-up.
- **Not built (out of this phase):** the café-admin **template/theme selector** (settings page with live
  preview) from the skill's "Admin selection" section — belongs in a café settings screen (follow-up).
- Seed café currently has **no item photos** (test images were removed) — the menu renders with panel
  placeholders until photos are uploaded via the Phase 5 admin uploader.

---

## Phase 7 — Platform admin
**Status:** ✅ done
**Skills:** auth-rbac, admin-resource, tenant-isolation
**Goal:** Operator manages all tenants.

**Checklist**
- [x] `app/(platform)/` guarded by `requireSuperAdmin()` (layout) + per-page guard.
- [x] Café CRUD + list (create café **with owner**, edit name/slug/template/plan, suspend/unsuspend).
- [x] User list + platform-role management (promote/demote, self-demote blocked); minimal `Plan` CRUD (no price).
- [x] Impersonation: explicit, **audit-logged** (who/when/whichCafe), **visibly banded** in the café-admin UI.

**Verify:** super-admin guard; café create+owner; impersonation band + scoped access; non-super cookie ignored;
audit entries; lint + typecheck + build pass.

**Report:** _(2026-06-27)_
Schema: added **`AuditLog`** model (+ `User.auditLogs`) — migration `20260626211441_add_audit_log`. It's a
platform table (NOT tenant-scoped, not in `TENANT_MODELS`); accessed via the base client by super-admins.
- `lib/audit.ts` `writeAudit(...)` — appended by every platform mutation + impersonation start/stop.
- `lib/impersonation.ts` — impersonation carried in an **httpOnly cookie**, honored ONLY for `SUPER_ADMIN`.
  Wired into `requireCafeRole` (super-admin impersonating exact café → OWNER) and `requireActiveCafe`
  (resolves the impersonated café, returns `impersonating: true`).
- `(platform)/cafes` — `schema.ts` (slug regex + reserved-word refine), `actions.ts` (`createCafe` in a
  `$transaction`: café + upsert owner + OWNER membership; `updateCafe` with `cafe:`/`menu:` tag revalidation;
  `setCafeStatus`; `startImpersonation`/`stopImpersonation`), `page.tsx` (create form + café table with inline
  edit / suspend / **«ورود به‌جای کافه»** + recent-activity audit list), client `CafeCreateForm`/`CafeRow`.
- `(platform)/users` — list + promote/demote (`setPlatformRole`, self-demote blocked, audited).
- `(platform)/plans` — `PlanForm` + `upsertPlan`/`deletePlan` (unlinks cafés then deletes), café counts.
- `(platform)/layout.tsx` — nav (کافه‌ها/کاربران/پلن‌ها). `(cafe-admin)/layout.tsx` — gold **impersonation
  banner** + «پایان جانشینی» (`stopImpersonation`).

**Verified (runtime, prod `next start`):**
- Super-admin → `/cafes` `/users` `/plans` all `200` (forms/controls present); café OWNER → `/users`
  `307 → /dashboard`.
- **Impersonation:** super-admin + impersonate cookie → `/dashboard` `200` rendering **as کافه دریا** with the
  **band shown**; `/menu` `200` (can manage the impersonated café).
- **Security:** a non-super-admin's impersonate cookie is **ignored** — owner stays on their own café, no band.
- **Café create + audit:** transaction created café + owner user + OWNER membership; `writeAudit` recorded
  `cafe.create`; `/cafes` shows the café, owner email, slug, and the audit entry in recent activity.
- `pnpm typecheck` · `lint` · `build` green (12 routes). Temp smoke removed; seed restored.

**Decisions / gotchas (carry forward):**
- **Prisma 7 `migrate dev` does NOT auto-run `generate`** — after a schema change run `pnpm exec prisma
  generate` (or `pnpm install`) before typecheck, else new models are missing from the client.
- Impersonation via **cookie (not JWT update)** — simpler + avoids `unstable_update`; always re-validated
  against `platformRole` server-side, so it can't be forged by a non-super-admin (verified).
- Café **hard-delete is intentionally omitted** (suspend is the soft path) — destructive cascade; add later
  with strong confirmation if needed.
- Audit list on `/cafes` shows the latest 10 — a dedicated `/audit` page with paging is a follow-up.

---

# Epic 2 — Design System Overhaul (post-MVP)

> Skills for the whole epic: **design-system** (primary) + **admin-resource**, **menu-templates**,
> **nextjs-conventions**. Hard rules from the MVP still apply (pnpm only, Node 24, tenant isolation,
> server-side authz, Zod at the boundary). One phase ≈ one session; stop and ask after each.

## Phase 8 — DS foundation (shadcn install + tokens + core components)
**Status:** ✅ done
**Skills:** design-system
**Goal:** shadcn/ui installed and themeable; core primitives available; build stays green. No surface
rewrites yet — just the foundation everything else builds on.

**Checklist**
- [ ] `pnpm dlx shadcn@latest init` → `components.json`, `lib/utils.ts` (`cn()`), Tailwind token wiring.
- [ ] Deps via pnpm: `class-variance-authority clsx tailwind-merge tailwindcss-animate lucide-react
      react-hook-form @hookform/resolvers next-themes` (zod already present).
- [ ] `tailwind.config.ts`: shadcn color mapping (semantic tokens) + `darkMode` selector; keep existing
      `font-sans` (IRANYekan→Poppins) and logical-utility usage.
- [ ] `app/globals.css`: **default (dark) shadcn token set in `:root`** (used everywhere). Leave the
      public menu's `--bg/--ink/…` template tokens untouched (separate namespace).
- [ ] Add core components: `button input label textarea select checkbox switch card sheet dialog
      alert-dialog dropdown-menu table form sonner badge separator skeleton`.
- [ ] No regressions: `pnpm lint && pnpm typecheck && pnpm build` green; existing pages still render.

**Verify:** build green; render a throwaway page with a few primitives in RTL; remove it.

**Report:** _(2026-06-27)_
shadcn/ui installed and wired without disturbing any existing surface (no rewrites — pure foundation).
- Deps (pnpm): `class-variance-authority clsx tailwind-merge tailwindcss-animate lucide-react
  react-hook-form @hookform/resolvers next-themes`.
- `lib/utils.ts` — `cn()` (clsx + tailwind-merge). `components.json` — new-york style, lucide,
  `cssVariables`, aliases (`@/components`, `@/lib/utils`, `@/components/ui`).
- 18 primitives added to `components/ui/`: button input label textarea select checkbox switch card
  sheet dialog alert-dialog dropdown-menu table form sonner badge separator skeleton.
- `tailwind.config.ts` — added `darkMode: ["selector", '[data-theme="dark"]']`, the full shadcn
  semantic color mapping (`hsl(var(--token))`), `borderRadius` scale, container, accordion
  keyframes/animation, and the `tailwindcss-animate` plugin. **Kept** the Persian-primary `font-sans`
  stack and legacy `bg/ink/hairline` aliases; the legacy `accent` color was **replaced** by shadcn's
  semantic `accent` (the public menu uses raw `--bg/--ink` vars, not Tailwind color classes, so it's
  unaffected).
- `app/globals.css` — default **dark editorial** shadcn token set in `:root` (gold `--primary`
  `40 47% 60%`, near-black `--background`, warm off-white `--foreground`); `@layer base` applies
  `border-border` + `bg-background text-foreground`. Legacy `--color-*` vars kept for transitional
  admin markup. Reduced-motion reset preserved.

**Collision handled:** the old ad-hoc `components/ui/form.tsx` (`Field`/`SubmitButton`/`FormMessage`/
`FormState`) was renamed to `components/ui/legacy-form.tsx` and its 8 import sites repointed, so shadcn's
RHF `form.tsx` could take the canonical path. Legacy gold references (`*-accent`) in admin/auth markup
were repointed to `*-primary`/`*-ring` so the brand gold survives until those surfaces migrate.
`components/ui/styles.ts` + `legacy-form.tsx` are transitional — retired in Phases 11–12.

**Verified:** `pnpm typecheck` clean · `pnpm lint` clean · `pnpm build` green (same 12 routes; public
`/darya`+`/kawa` still SSG/ISR). `lucide-react` resolved at 1.21.0 (icons type-check fine).

**Decisions / gotchas (carry forward):**
- `darkMode` uses a **custom selector** (`[data-theme="dark"]`) to align with the Phase 9 next-themes
  `attribute="data-theme"` system — not the default `.dark` class.
- macOS BSD `sed` has no `\b`; the accent→primary repoint used a literal `-accent` substitution scoped
  to the 9 legacy files only (never `components/ui/*` shadcn sources or `components/menu/*`).
- Build needs Postgres up (`docker compose up -d postgres`) for `generateStaticParams`; OrbStack was
  started this session.

## Phase 9 — Admin theme system (Light/Dark/Sepia, extensible)
**Status:** ✅ done
**Skills:** design-system
**Goal:** Admin surfaces can switch theme; the public menu is unaffected; adding a theme is trivial.

**Checklist**
- [ ] `lib/themes.ts` registry: `THEMES` (`{id,label}`: dark/light/sepia, labels in Persian) + `THEME_NAMES`.
- [ ] `components/providers/ThemeProvider` (next-themes: `attribute="data-theme"`, `defaultTheme="dark"`,
      `enableSystem={false}`) wrapping **only** `(cafe-admin)` + `(platform)` layouts (not public).
- [ ] Admin layouts render `<div className="admin-root">`; theme token blocks scoped
      `html[data-theme="<id>"] .admin-root {…}` for the full shadcn token set (dark/light/sepia).
- [ ] `ThemeSwitcher` (shadcn `DropdownMenu` + `useTheme`), mounted in the admin header; no hydration flash.
- [ ] Verify: switching theme restyles admin only; load a public `[cafeSlug]` page in each theme → unchanged.

**Report:** _(2026-06-27)_
- `lib/themes.ts` — `THEMES` (`dark`/`light`/`sepia`, Persian labels تیره/روشن/سپیا) + `THEME_NAMES` +
  `DEFAULT_THEME="dark"`. Adding a theme = one entry here + one CSS block.
- `components/providers/ThemeProvider.tsx` — next-themes (`attribute="data-theme"`, `themes={THEME_NAMES}`,
  `defaultTheme="dark"`, `enableSystem={false}`, `disableTransitionOnChange`). Wraps **only** the two
  admin layouts.
- `components/providers/ThemeSwitcher.tsx` — shadcn `DropdownMenu` + `useTheme`, iterates `THEMES`,
  active check, renders post-mount (no hydration flash). Mounted in both admin headers.
- `app/globals.css` — three `html[data-theme="<id>"] .admin-root { … }` blocks (full shadcn token set +
  `color-scheme`). Each also **bridges** the legacy `--color-bg/ink/hairline` aliases so the
  not-yet-migrated admin markup themes correctly in all three themes; the bridge is dropped as surfaces
  move to shadcn primitives (Phases 11–12).
- Both admin layouts now render `<ThemeProvider><div className="admin-root … bg-background text-foreground">`.

**Verified:** `pnpm typecheck` · `lint` · `build` green (13 static pages). Scoping is structural: the
public layout has **no** ThemeProvider and **no** `.admin-root`, and the overrides are `.admin-root`-scoped,
so an admin theme can never reach the public menu (which keeps its per-café `ThemeScope` + `menu.css`).

**Decisions / gotchas (carry forward):**
- `tailwind.config` `darkMode` selector is `[data-theme="dark"]` to match next-themes' attribute.
- Legacy `--color-*` bridge is intentional + temporary — once Phases 11–12 retire `styles.ts`/
  `legacy-form.tsx`, those alias lines can be deleted from each theme block.

## Phase 10 — Responsive admin shell
**Status:** ✅ done
**Skills:** design-system, auth-rbac
**Goal:** café-admin + platform layouts work at mobile/tablet/desktop with reachable nav, café switcher,
theme switcher, and the impersonation banner.

**Checklist**
- [ ] Header refactor on shadcn; nav collapses into a `Sheet` (hamburger) under `md`.
- [ ] Café switcher rebuilt (shadcn `Select`/`DropdownMenu`) — still sourced from session memberships, never URL.
- [ ] Theme switcher + logout reachable at all sizes; impersonation banner restyled, responsive.
- [ ] Verify at 375 / 768 / 1280 widths; RTL correct (Sheet/dropdown sides).

**Report:** _(2026-06-27)_
Both admin headers (`(cafe-admin)` + `(platform)`) rebuilt on shadcn primitives, responsive + sticky.
- `components/admin/AdminNav.tsx` (client) — desktop (`md+`) inline link row; below `md` a hamburger
  opens a `Sheet` from the inline-start edge (RTL → `side="right"`) with the nav links; `usePathname`
  marks the active item; `SheetClose` dismisses on navigation.
- `components/admin/CafeSwitcher.tsx` (client) — shadcn `Select` sourced from session memberships
  (names fetched in the layout). On change it posts to `setActiveCafe` (which **re-validates membership
  server-side**) inside a `useTransition`, then `router.refresh()`. Replaces the native `<select>`.
- `(cafe-admin)/layout.tsx` — header shows café name + role `Badge`, `AdminNav`, `CafeSwitcher` (only
  when >1 membership), `ThemeSwitcher`, logout `Button`. Impersonation banner restyled with
  `primary`/`primary-foreground`, wraps on small screens. Content capped at `max-w-6xl`, padding scales
  `p-4 sm:p-6`.
- `(platform)/layout.tsx` — same shell with platform nav + SUPER ADMIN `Badge`.

**Verified:** `pnpm typecheck` · `lint` · `build` green (13 pages). Header is flex with logical spacing
(no hard left/right); switchers/theme/logout reachable at all sizes (hamburger under `md`). RTL Sheet
side + dropdown `align="end"` chosen logically.

**Decisions / gotchas (carry forward):**
- Café switcher now shows café **names** (layout fetches them for the user's membership ids via the base
  client — legitimate, the user belongs to each) instead of raw ids.
- Full visual 375/768/1280 + theme runtime sweep is folded into the Phase 14 polish pass (all admin
  surfaces present by then); structure verified via build + component review here.

## Phase 11 — Admin forms → `Sheet` drawer + react-hook-form
**Status:** ✅ done _(implemented together with Phase 12 — forms moving into Sheets restructures the tables; verified once)_
**Skills:** design-system, admin-resource
**Goal:** every admin create/edit form opens in a side `Sheet`, validated with RHF + zodResolver,
submitting to the existing Server Actions (which still authorize + re-validate).

**Checklist**
- [ ] Convert actions to **typed-object args** returning `ActionResult` (`{ ok }|{ ok:false, error?, fieldErrors? }`).
- [ ] Migrate forms: category, item, plan, café create/edit, user role, (settings) → shadcn `Form` + RHF
      in a `Sheet`; map server `fieldErrors` back; `sonner` toast on success; `AlertDialog` for deletes.
- [ ] Image uploader (item) still works inside the drawer (presign → MinIO → blurhash unchanged).
- [ ] Verify: create/edit/delete each resource end-to-end; server still rejects bad/unauthorized input.

**Report:** _(2026-06-27)_
All admin Server Actions converted to **typed-object args returning `ActionResult`**
(`{ ok:true } | { ok:false; error?; fieldErrors? }`); every form is RHF + zodResolver in a `Sheet`.
- `lib/action-result.ts` — `ActionResult` + `zodToActionResult` (maps ZodError → per-field messages).
- `components/admin/FormSheet.tsx` — side `Sheet` (RTL inline-end = `side="left"`, `w-full sm:max-w-md`),
  render-prop `children(close)`. `ConfirmDialog.tsx` — `AlertDialog` for destructive actions, runs the
  action in a transition + toasts. `fields.tsx` — RHF wrappers (`TextField`/`NumberField`/`TextareaField`/
  `SwitchField`/`SelectField`) over shadcn `Form`. `form-utils.ts` — `applyActionResult` (toast + map
  `fieldErrors` via `form.setError` + close).
- Actions rewritten: menu (`upsertCategory`/`deleteCategory`/`upsertItem`/`deleteItem`/
  `toggleItemAvailability`/`attachImage`/`deleteImage`), cafes (`createCafe`/`updateCafe`/`setCafeStatus`/
  `startImpersonation(cafeId)`), plans (`upsertPlan`/`deletePlan`), users (`setPlatformRole({…,superAdmin:boolean})`).
  Each still **guards then `Schema.parse`** server-side.
- Forms (RHF): `CategoryForm`, `ItemForm`, `PlanForm`, `CafeCreateForm`, `CafeEditForm`; launchers
  `CategorySheet`/`ItemSheet`/`CafeCreateSheet`/`PlanSheet` (client wrappers so a Server Component page can
  open a render-prop Sheet). Item image management lives inside the item edit Sheet.
- `sonner` `<Toaster>` mounted in both admin layouts (inside `ThemeProvider`, theme-aware).

**Schema change (important):** the shared Zod inputs **dropped `z.preprocess`/`z.coerce`** in favour of
plain `z.number()/z.boolean()/z.string().optional()`, so `z.input === z.output` (required for RHF +
zodResolver typing under react-hook-form 7.80). Coercion is no longer needed because actions now receive
typed objects from the client (not FormData strings); `NumberField` emits real numbers via
`valueAsNumber`, `SwitchField` emits booleans.

**Verified (runtime, prod `next start`):** owner login → `/dashboard` + `/menu` `200` rendering seeded
categories/items + the «دستهٔ جدید»/«افزودن آیتم» Sheet triggers; super-admin → `/cafes`,`/users`,`/plans`
`200` with «کافهٔ جدید», audit list, café rows + «ورود به‌جای کافه». No client-side exceptions.
`pnpm typecheck` · `lint` · `build` green (13 pages).

## Phase 12 — Admin pages/tables on shadcn (responsive)
**Status:** ✅ done
**Skills:** design-system, admin-resource
**Goal:** all admin lists/pages use shadcn (`Table`/`Card`/`Badge`…), responsive (no overflow), replacing
the ad-hoc `components/ui/styles.ts` classes.

**Checklist**
- [ ] `components/admin/DataTable` on shadcn `Table`; stacks into cards under `sm`.
- [ ] Convert café-admin (`menu`, `dashboard`) + platform (`cafes`, `users`, `plans`) lists/pages.
- [ ] Retire/replace `components/ui/styles.ts` ad-hoc class helpers and the old `form.tsx`.
- [ ] Verify: every admin page responsive + themed in all three themes; gates green.

**Report:** _(2026-06-27, with Phase 11)_
- `components/admin/DataTable.tsx` rebuilt on shadcn `Table` (wrapped in `overflow-x-auto rounded-lg
  border` so it never overflows on phones). Rows are now client components: `ItemRow` (menu),
  `CafeRow` (cafes), `PlanRow` (plans), `UserRow` (users) — using shadcn `TableRow/TableCell`, `Badge`
  for status/role, `Switch` for availability, `Button` for actions, `FormSheet` for edit, `ConfirmDialog`
  for destructive ops.
- Pages converted to shadcn + semantic tokens: café-admin `menu` (per-category `CategorySection`),
  `dashboard` (stat `Card`s); platform `cafes` (create Sheet + table + recent-activity `Card`), `plans`,
  `users`. Headers use `bg-background/border/muted-foreground` etc. — no legacy `ink/hairline` in admin.
- **Retired:** `components/ui/styles.ts` (ad-hoc class strings), `components/ui/legacy-form.tsx`, and the
  menu `DeleteButton.tsx` — all deleted. The legacy `--color-*` theme-bridge in globals.css is now only
  used by the public landing (`app/page.tsx`) and `/login`, which keep the Étude dark look intentionally.

**Verified:** same runtime smoke as Phase 11 (all admin lists render with shadcn `Table`); gates green.
Responsive: tables scroll horizontally under their container; header collapses to the Sheet nav under
`md` (Phase 10). Full 3-theme visual sweep folded into Phase 14.

**Decisions / gotchas (carry forward):**
- A Server Component can't pass a render-prop function to a client `FormSheet`/`ConfirmDialog`, so each
  "add" entry point is a tiny client launcher (`*Sheet`) and each table row is a client component that
  owns its action closures.
- Tables use horizontal scroll (the rule allows "scroll **or** stack into cards under sm"); a card-stack
  variant is a Phase 14 nicety if needed.

## Phase 13 — Public menu templates rebuilt on shadcn + responsive
**Status:** ✅ done
**Skills:** menu-templates, design-system
**Goal:** the three templates use shadcn primitives + `cn()` while preserving their bespoke look and
per-café `ThemeScope`; all scale gracefully to tablet/desktop. (Largest/riskiest phase — may split.)

**Checklist**
- [ ] Shared core (`ImageCarousel`, `FullscreenViewer`, `ItemDetailContent`) composes shadcn where it
      fits (`Sheet`/`Dialog` for detail/fullscreen) without losing drag/snap or `dir="ltr"` track.
- [ ] Warm/Scandi/Editorial keep distinct layouts + `tokens.css` per-`[data-template]` sets; not flattened.
- [ ] Responsive: phone-first, but `md+` caps width / widens grid; verify all three on 375/768/1280.
- [ ] Stays SSG/ISR + code-split per template; imgproxy loader + blurhash + Persian digits intact.
- [ ] Verify: each template renders correctly, detail/fullscreen work on touch; not affected by admin theme.

**Report:** _(2026-06-27)_
Made the three templates **responsive (md/lg)** and adopted **`cn()`** across the menu, while preserving
the bespoke per-café look and the shared headless core untouched.
- `menu.css` — added a responsive layer: **Scandi** grid 2 → 3 (`md`) → 4 (`lg`) columns with wider
  containers; **Warm** single-column feed → 2-col card grid on `md+` (wider container, larger thumbs);
  **Editorial** stays full-bleed/immersive but the centred column widens to 600px on `lg` (the rest of the
  viewport is intentional `--bg` letterboxing); the shared detail body + bottom `sheet` scale up on `md+`.
- `cn()` (the shadcn class util) now composes every conditional class in the templates + core
  (`w-pill`/`w-card`, `s-tab`/`s-card`, Editorial `take`, carousel/fullscreen `pd` dots) — replacing
  string-concat per the styling rule ("build on `cn()`").

**Reasoned deviation (important):** the skill suggests composing shadcn `Sheet`/`Dialog` for the
detail/fullscreen, but Radix **portals to `<body>`, outside the per-café `ThemeScope` wrapper**, and the
menu's `--bg/--ink/--accent` tokens **and** the `.menu-root`-scoped `.photo` base styles both inherit
through the in-tree DOM — portaling would drop both. The skill's higher invariant is "compose **without
losing per-café `ThemeScope`**" and "keep the bespoke layout; don't flatten into generic shadcn cards", so
the tuned, themed **detail takeover + bottom-sheet + fullscreen stay bespoke and in-tree** (the shared
core the skill says not to reinvent). shadcn's *styled* primitives (Button/Badge/Card) are also a poor fit
here because they're driven by the admin `--primary/...` tokens, not the café palette. The menu's shadcn
alignment is therefore: the shared `cn()` util + rendering within the default shadcn `:root` (so any
incidental primitive still works) + full responsiveness — not a re-skin that would break theming.
Focus-trap/keyboard a11y for the in-tree overlays is handled in Phase 14.

**Verified (runtime, prod `next start`):** `/darya` `200` → `data-template="editorial"` (chips + snap
feed); `/kawa` `200` → `data-template="warm"`. **No admin-theme leak** — public HTML has no `admin-root`
or `data-theme`. Code-split per template + SSG/ISR intact (build shows `●` for `/[cafeSlug]`).
`pnpm typecheck` · `lint` · `build` green (13 pages).

**Decisions / gotchas (carry forward):**
- Don't portal menu overlays via Radix unless you also re-scope `.menu-root[data-template]` + the café
  vars **and** restate the `.photo` base styles inside the portal — otherwise theming + image sizing break.
- Editorial is intentionally immersive on desktop (centred 600px column) — it's not meant to fill ultrawide.

## Phase 14 — Polish (a11y, RTL audit, theme contrast, docs sync)
**Status:** ✅ done
**Skills:** design-system
**Goal:** ship-quality pass across the whole app.

**Checklist**
- [ ] RTL audit of every shadcn component (Sheet sides, dropdown/menu alignment, icons).
- [ ] Keyboard focus + focus-trap in Sheets/Dialogs; visible focus rings; `prefers-reduced-motion`.
- [ ] Contrast check for all three admin themes; touch targets ≥ 40px.
- [ ] Update docs if anything drifted (CLAUDE.md / rules / skills); final `lint`+`typecheck`+`build`.

**Report:** _(2026-06-27)_
Ship-quality pass across the app.
- **RTL:** shadcn `Sheet` + `Dialog` close buttons moved from physical `right-4` → logical **`end-4`** so
  they sit at the inline-end (trailing) corner under `dir="rtl"`. Form `Sheet` opens from `side="left"`
  (inline-end), nav `Sheet` from `side="right"` (inline-start hamburger), dropdowns `align="end"` — all
  logical. Admin markup uses logical utilities throughout (`ps/pe/ms/me`, `text-start/end`).
- **Keyboard a11y:** the bespoke menu overlays (Warm/Scandi `DetailSheet`, Editorial takeover,
  `FullscreenViewer`) now carry `role="dialog" aria-modal="true"` + an `aria-label`, **move focus to the
  close button on open**, and close on `Escape`. Added a `:focus-visible` outline (in `--accent`) for all
  menu controls. shadcn primitives already ship `focus-visible:ring`. `prefers-reduced-motion` resets are
  intact (globals.css + menu.css).
- **Contrast / touch:** the three admin themes use high-contrast pairs (dark 93%/4%, light 9%/100%, sepia
  17%/91%); gold `--primary` darkens to 42% on light for AA on white. Public menu controls are ≥38–42px
  touch targets; admin actions use shadcn sizes (utilitarian surface).
- **Docs:** `CLAUDE.md` directory map + stack already describe the shadcn/theme/Sheet system (now real —
  no drift); this file's reports are the authoritative record. Session log updated below.

**Verified:** `pnpm typecheck` · `lint` · `build` green (13 pages). Final runtime smoke: public `/darya`
`/kawa` `200`; platform-admin `/cafes` `/users` `/plans` `200` (super-admin without a café membership is
correctly redirected from `/dashboard` `/menu` → `/cafes`).

**Decisions / gotchas (carry forward):**
- Full programmatic focus-trap inside the bespoke menu overlays is not implemented (focus is moved in +
  `Escape`/close work); the overlays are simple and single-action. A Radix-based trap would reintroduce
  the body-portal/ThemeScope problem documented in Phase 13 — revisit only if a full trap is required.
- `app/page.tsx` (landing) + `/login` intentionally keep the Étude dark look via the legacy `--color-*`
  `:root` tokens; they're outside the admin theme system by design.

---

## Epic 2 status — ✅ COMPLETE (phases 8–14)
shadcn/ui is the foundation across every surface; admin is fully responsive with an extensible
light/dark/sepia theme system, all admin entry forms are RHF + zodResolver in side `Sheet` drawers backed
by typed-object Server Actions returning `ActionResult`, admin lists are shadcn `Table`s, and the three
public templates are responsive + `cn()`-composed while keeping their bespoke per-café `ThemeScope` look.

---

# Post-Epic-2 feature work (2026-06-27/28)

> Discrete features added after Epic 2, outside the phased plan. Each shipped guarded + Zod-validated +
> gates green. Recorded here so this file stays the authoritative build record.

## Branding, item price & display toggles
**Status:** ✅ done · **Skills:** prisma-data-model, image-pipeline, design-system, menu-templates
- **Per-café logo** — `Cafe.logoKey String?` (MinIO `cafes/{id}/branding/…`; null = none). Uploaded in a new
  **café-admin `settings`** surface (OWNER/ADMIN; STAFF redirected) via the existing presign pipeline
  (`/api/presign` gained `kind:"item"|"logo"`); rendered on the **visual-left** of the public menu header in
  all three templates. `lib/image.ts` `imgUrl` gained a `mode:"fit"` (no-crop) for logos.
- **Item price** — `Item.price Int?` (whole **تومان**, no decimals; null = hidden). Editable in the menu
  editor; shown on every template + the detail body. Formatted with **Persian digits + thousands grouping**
  via `lib/format.ts` `faToman` (`Intl.NumberFormat('fa-IR')` + « تومان»). **Supersedes the Phase 4
  "no price field / calorie-forward" decision** — menus are now price-capable; price stays optional.
- **Customizable display** — `Cafe.showCalories`/`showPrice Boolean @default(true)`, toggled in café-admin
  `settings`. **Gated at the DTO boundary** in the public loader (`getMenu(cafeId, showCalories, showPrice)`)
  so templates stay flag-agnostic; cache key includes both flags.
- **Category subtitle** — `Category.subtitle Json?` (`{fa,en?}`, e.g. «بر پایه قهوه»). Stored + seeded; not
  yet surfaced in the public template contract (follow-up if a template wants to render it).
- Migrations: `20260627123918_add_branding_price_display`, `20260627220627_add_category_subtitle`.

## Default-menu seeder (super-admin, in-app)
**Status:** ✅ done · **Skills:** tenant-isolation, image-pipeline, admin-resource
- **`lib/seed/`** holds the bundled default menu (`data.json` + `item_images/`) and **`import-menu.ts`**
  (`seedCafeMenu(cafeId)`), a `server-only` importer that writes via **`getTenantPrisma`** (auto-scoped
  `cafeId` — tenant-isolation-compliant). Idempotent/additive: categories upsert by (café, fa-title), items
  by (café, category, fa-title); re-running updates name/subtitle/price/ingredients/order, never duplicates
  or deletes. Ingredients parse from the seed's comma-separated string → `string[]`. Photos attach by strict
  `<English title>.png` match and are **normalized to a small JPEG master** (≤2000px, q80) before upload so
  imgproxy reads from a ~5–10× smaller source; blurhash recomputed from the normalized image.
- **Trigger:** platform-admin → **کافه‌ها** row → «منوی پیش‌فرض» (`ConfirmDialog`, non-destructive) →
  `seedCafeDefaultMenu(cafeId)` (`requireSuperAdmin` → import → `writeAudit("cafe.seed_menu")` →
  `revalidateTag`). Runs synchronously (~10–20s for a fresh café); background-queue it via BullMQ only if needed.
- **Retired** the standalone CLI (`prisma/seed/import-menu.ts` + `seed:menu` script) — logic now lives in-app.
- `next.config.ts` traces `lib/seed/**` for `/cafes` so the seeder works in a standalone build, not just dev.
- `ConfirmDialog` gained a `destructive?: boolean` flag (defaults true; existing callers unaffected).
- **Verified** end-to-end through the real Next runtime against a fresh café (temp route, since removed):
  8 categories / 87 items (all priced, 72 with ingredients) / 12 normalized images, `imageFailures:0`;
  re-run idempotent (12 skipped). Temp café + its MinIO objects cleaned up. `typecheck`·`lint`·`build` green.

## Production deployment & runtime config
**Status:** ✅ done · **Skills:** nextjs-conventions, security
- **Domain `foodila.ir`** — single-host `docker-compose.prod.yml`; **nginx is the only public service**
  (80/443) and reverse-proxies three subdomains: apex → `app:3000`, `cdn.` → `imgproxy:8080`,
  `s3.` → `minio:9000`. Subdomains chosen over path-routing because S3 **SigV4 signs host+path** — a path
  rewrite would break presigned uploads. TLS via **Let's Encrypt/certbot** (one SAN cert, 6-h reload +
  twice-daily renew). Postgres/MinIO/imgproxy are never exposed.
- **Runtime/build** — `next.config.ts` → `output: "standalone"`; multi-stage `Dockerfile`
  (deps → builder → lean runner, ~368 MB, boots ~93 ms). Build-time **placeholder** env satisfy
  `prisma generate` (postinstall reads `prisma.config.ts`) and `lib/env` validation **without baking
  secrets**; the generated client (gitignored `lib/generated`) is carried from `deps` into `builder`.
  `generateStaticParams` tolerates an unreachable DB at image-build time (falls back to ISR).
- **MinIO endpoint split** — `lib/storage.ts` now has a **public** client (`MINIO_ENDPOINT`, browser
  presign URLs) and an **internal** client (`MINIO_INTERNAL_ENDPOINT`, server reads/writes — no TLS/proxy
  round-trip). `lib/env.ts` gained `MINIO_INTERNAL_ENDPOINT` (optional, defaults to public) + `NODE_ENV`.
- **Auto-migrate, manual-seed** — one-shot `migrate` service runs `prisma migrate deploy`; `app` waits on
  `service_completed_successfully` (schema guaranteed before first request). Seeding stays a deliberate
  one-time `dcp run --rm migrate pnpm db:seed`. Plus `createbuckets`, `imgproxy`, `certbot` renew loop,
  `nginx/templates/default.conf.template` (3 TLS vhosts, 30 MB upload on `s3.`, immutable cache on `cdn.`),
  `nginx/init-letsencrypt.sh` bootstrap.
- **Docs/safety** — `.env.production.example`, `DEPLOY.md` (Ubuntu 22/24 runbook + **§4b coexistence**:
  this host already runs elitera/metabase stacks, so only 80/443 must be free — everything else stays on a
  private network), `.dockerignore`. **`.gitignore` leak fix:** `.env.production` was **not** ignored
  before (only `.env`/`*.local`) → now all `.env.*` except the committed examples, plus `nginx/certbot/`
  (TLS private keys). **No Redis** (single instance, in-memory rate-limit) — add when scaling out.
- **Verified locally:** image builds + boots + serves `/` `/login` `200`; `docker compose config` valid
  (only nginx publishes ports); gates green. TLS issuance + subdomain routing are the on-server step
  (need real DNS + 80/443) — documented, not runnable here.

## Migrations squashed to a single `0_init` baseline
**Status:** ✅ done · **Skills:** prisma-data-model
- The four dev migrations (`…_init`, `add_audit_log`, `add_branding_price_display`,
  `add_category_subtitle`) collapsed into **one `0_init`** so first deploy applies a single migration.
  Generated with `prisma migrate diff --from-empty --to-schema`. **Proven faithful three ways:** the live
  dev DB (all 4 applied) diffs **empty** vs `schema.prisma`; the originals are pure DDL; `0_init` applies
  cleanly to a throwaway empty DB. Local `_prisma_migrations` re-baselined to `0_init` only
  (`migrate status` → up to date). **Safe only because no environment had the old migrations applied yet —
  do not squash again once production is live; add timestamped migrations on top instead.**

## Account settings — self-service change password
**Status:** ✅ done · **Skills:** auth-rbac, design-system
- New **`(account)` route group** with its own themed `admin-root` shell so **`/account` exists once** and
  is reachable by **every** signed-in user (SUPER_ADMIN + all café roles **incl. STAFF**) — a page in both
  admin groups would collide on the same path. "بازگشت" returns to the tier's home; linked from both admin
  headers (café nav available to STAFF too).
- Three-field **verification form** (current / new / confirm) — RHF + zodResolver reusing the shared
  `TextField` + `applyActionResult`. `changePassword` Server Action is **user-scoped**: `requireUser`
  (targets the **session** user only, never a client-supplied id) → **re-verify current password** against
  the stored scrypt hash → re-parse the same Zod rules (min 8, new ≠ current, confirm match) → write the
  new `hashPassword` → `writeAudit("user.password_change")`. Returns `ActionResult` (field error on a wrong
  current password). **Replaces** the need to rotate passwords via a container command.
- Gates green: `typecheck`·`lint`·`build` (`/account` compiles dynamic `ƒ`, no route collision).

---

## Session log
_(one line per session: date · phase · outcome)_
- 2026-06-26 · Phase 1 (Scaffold & tooling) · ✅ done — Next 15 + TS + Tailwind + Prisma + Zod scaffold; lint/typecheck/build green.
- 2026-06-26 · Phase 2 (Data model & tenant client) · ✅ done — full schema + init migration + seed; tenant isolation proven at runtime; gates green.
- 2026-06-26 · Maintenance · Upgraded Prisma 6 → 7 (driver adapter + prisma.config.ts + prisma-client generator); Node → 24.18.0 LTS (@types/node ^24); gates green, no data migration needed.
- 2026-06-26 · Phase 3 (Auth & RBAC) · ✅ done — NextAuth v5 credentials/JWT, edge/Node split, two-tier guards; full login flow + RBAC verified over real HTTP; gates green.
- 2026-06-26 · Phase 4 (Café-admin menu CRUD) · ✅ done — category+item CRUD (guard→Zod→scoped→revalidateTag); read verified over HTTP, scoped mutations + cross-tenant rejection proven; gates green.
- 2026-06-26 · Phase 5 (Image pipeline) · ✅ done — MinIO+imgproxy up; presign→PUT→blurhash→signed imgproxy serve; presign route + attach/render/serve verified; gates green.
- 2026-06-27 · Phase 6 (Public menu) · ✅ done — 3 swappable templates (Editorial port + Warm/Scandi), shared carousel/fullscreen core, ThemeScope, SSG+ISR; render/template-selection/imgproxy/tag-revalidation verified over HTTP; gates green.
- 2026-06-27 · Phase 7 (Platform admin) · ✅ done — café/user/plan management + audited impersonation (AuditLog model + migration); guard/impersonation-security/audit verified over HTTP; gates green. **MVP COMPLETE (7/7).**
- 2026-06-27 · Maintenance · Self-hosted fonts (IRANYekan + Poppins via next/font/local in app/fonts/), Persian-primary stack; remapped docker ports clear of busy host (pg 5455, minio 9410/9411, imgproxy 8810); added LOCAL_SETUP.md.
- 2026-06-27 · Planning · Defined **Epic 2 — Design System Overhaul** (phases 8–14): shadcn everywhere, fully responsive, admin `Sheet` drawer forms, admin-only extensible themes (Light/Dark/Sepia, default Dark), RHF+zodResolver with Server Actions authoritative. Added `design-system` skill; updated CLAUDE.md, styling-rtl + typescript rules, admin-resource + menu-templates skills. No code changed yet — awaiting go for Phase 8.
- 2026-06-27 · Phase 8 (DS foundation) · ✅ done — shadcn/ui installed (18 primitives) + `cn()` + tokens wired (dark default in `:root`); legacy `form.tsx`/`accent` migrated without surface rewrites; gates green.
- 2026-06-27 · Phase 9 (Admin theme system) · ✅ done — `lib/themes.ts` registry + next-themes provider (admin-only) + `.admin-root`-scoped dark/light/sepia token blocks + `ThemeSwitcher`; public menu unaffected by construction; gates green.
- 2026-06-27 · Phase 10 (Responsive admin shell) · ✅ done — both admin headers rebuilt on shadcn (sticky, hamburger `Sheet` nav under md, shadcn `Select` café switcher, theme/logout, responsive impersonation banner); gates green.
- 2026-06-27 · Phases 11+12 (Admin forms→Sheet + pages/tables→shadcn) · ✅ done — all actions → typed-object args returning `ActionResult`; RHF+zodResolver forms in `FormSheet` drawers + `ConfirmDialog` deletes + sonner; shadcn `Table` rows; retired `styles.ts`/`legacy-form.tsx`/`DeleteButton`; schemas dropped preprocess/coerce (RHF typing); verified over HTTP (owner + super-admin); gates green.
- 2026-06-27 · Phase 13 (Public menu responsive + cn) · ✅ done — md/lg responsive layer (Scandi 2→4 cols, Warm 1→2 cols, Editorial capped) + `cn()` across templates/core; bespoke themed overlays kept in-tree (Radix body-portal breaks ThemeScope — documented); render + no admin-theme-leak verified; gates green.
- 2026-06-27 · Phase 14 (Polish) · ✅ done — RTL `end-4` close buttons; menu overlays get `role=dialog`/`aria-modal`/focus-on-open/Esc + `:focus-visible`; theme contrast + touch targets reviewed; docs synced. **EPIC 2 COMPLETE (7/7).** Final gates green; public + admin runtime smoke passed.
- 2026-06-27 · Features (branding + price + display toggles) · ✅ done — per-café logo (`Cafe.logoKey`, café-admin settings + public header), item price (`Item.price`, تومان via `faToman`, editor + all templates), `Cafe.showCalories`/`showPrice` toggles gated at the DTO; `Category.subtitle`; migrations add_branding_price_display + add_category_subtitle; gates green.
- 2026-06-28 · Feature (default-menu seeder) · ✅ done — in-app super-admin trigger (`lib/seed/import-menu.ts` via `getTenantPrisma`, idempotent/additive, JPEG master normalization, ingredients string→array); platform «منوی پیش‌فرض» row action (audited + revalidates); retired the `seed:menu` CLI; verified end-to-end on a fresh café; gates green.
- 2026-06-28 · Deploy (production setup) · ✅ done — `output:standalone` + multi-stage Dockerfile, `docker-compose.prod.yml` (nginx-only public, one-shot `migrate`, certbot), nginx subdomain TLS vhosts for **foodila.ir** (app/cdn/s3), MinIO public/internal endpoint split, NODE_ENV, DEPLOY.md (Ubuntu 22/24 + host coexistence), `.gitignore` secret-leak fix; image builds + boots + compose validates; gates green.
- 2026-06-28 · Maintenance (migration squash) · ✅ done — 4 dev migrations → single `0_init` baseline (faithful: empty-diff vs schema + clean apply to fresh DB); local `_prisma_migrations` re-baselined; don't squash again post-production.
- 2026-06-28 · Feature (account change-password) · ✅ done — new `(account)` route group + self-service change-password (`requireUser`, current-password re-verify vs scrypt hash, audited) for super-admin + every café role (incl. STAFF); three-field verification form (RHF+zodResolver); linked from both admin headers; `/account` dynamic, no collision; gates green.
