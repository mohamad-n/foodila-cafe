# Café Menu SaaS — Project Guide

Multi-tenant SaaS for **QR-code café menus**. A customer scans a QR code and lands on an
immersive, photo-forward, **Persian (RTL)** menu. Café staff manage their own menu; platform
operators manage all tenants. The public menu is **template-based**: each café picks one of three
layouts — **Warm**, **Scandi**, or **Editorial** (default) — rendered with the café's theme tokens.

> Read this file fully before writing code. The `@`-imported rule files below are binding.
> When a task matches a skill in `.claude/skills/`, consult that skill first.

---

## Stack (do not substitute without asking)

- **Next.js (App Router)** — RSC-first, Server Actions for mutations, Route Handlers only where a
  public/webhook HTTP endpoint is genuinely needed. TypeScript `strict`.
- **Prisma + PostgreSQL** — single shared database, shared schema, tenant data separated by `cafeId`.
- **Auth.js (NextAuth v5)** + Prisma adapter — credentials/email; sessions via JWT.
- **MinIO** (S3-compatible) for object storage + **imgproxy** for on-the-fly AVIF/WebP/resize +
  **blurhash** LQIP placeholders.
- **Redis** (`ioredis`) — supporting store for rate limiting, BullMQ jobs (image processing), and a
  shared ISR/data cache across instances. **Postgres stays the source of truth.** See the redis rule.
- **Tailwind CSS** — RTL-aware; self-hosted fonts (IRANYekan for Persian, Poppins for Latin) via
  `next/font/local` in `app/fonts/`; design tokens as CSS variables (per-template defaults +
  per-café `themeTokens` overrides).
- **shadcn/ui** (Radix primitives + CVA + the `cn()` util in `lib/utils.ts`, sources owned in
  `components/ui/`) — the single component foundation across **all** surfaces. Fully responsive,
  RTL-correct. **react-hook-form + @hookform/resolvers** for client-side form UX (server stays the
  authoritative validator), **next-themes** for the admin-only theme system, **lucide-react** icons.
  → `.claude/skills/design-system/SKILL.md`
- **Zod** — validate every external input (forms, params, env) at the boundary.
- **pnpm** package manager. **Docker / docker-compose** for local. (Deployment specifics — CI/CD, registry,
  Hetzner — are deferred; don't generate deploy config yet.)

> **Scope notes:** billing/**pricing is out of scope for now** — keep `Plan` minimal, no price fields.
> Deployment specifications are deferred.

---

## The three surfaces (route groups)

| Group | Path | Auth | Purpose |
|---|---|---|---|
| Public menu | `app/(public)/[cafeSlug]/…` | none | The customer menu. One of three templates (Warm/Scandi/Editorial) per café. SSG/ISR, edge-cacheable. |
| Café admin | `app/(cafe-admin)/…` | `Membership` role | A café manages **its own** menu, photos, staff. |
| Platform admin | `app/(platform)/…` | `SUPER_ADMIN` | Operator manages **all** cafés, plans, suspensions, impersonation. |

Active café for the café-admin surface is resolved from the signed-in user's `Membership`
(with a café switcher when they belong to more than one). It is **never** read from a URL the
client controls.

---

## Two privileged tiers (RBAC)

- **Platform tier** — `User.platformRole: SUPER_ADMIN`. Cross-tenant. Guard with `requireSuperAdmin()`.
- **Café tier** — `Membership.role: OWNER | ADMIN | STAFF`, scoped to one `cafeId`.
  - `OWNER` — everything in the café incl. billing + staff management.
  - `ADMIN` — menu + staff, no billing.
  - `STAFF` — menu content + availability toggles only.
  - Guard with `requireCafeRole(cafeId, [...])`.

See `.claude/skills/auth-rbac/SKILL.md` for the guard helpers and where they live.

---

## Cardinal rules (non-negotiable)

1. **Tenant isolation is sacred.** Every tenant-owned query/mutation is scoped by `cafeId`. Use the
   tenant-scoped Prisma client — never the raw client for tenant data. A missing `cafeId` filter is a
   security incident, not a bug. → `.claude/skills/tenant-isolation/SKILL.md`
2. **Authorize every mutation.** No Server Action mutates data without first calling a guard
   (`requireSuperAdmin` / `requireCafeRole`). Authorization happens server-side, never trusted from the client.
3. **Validate at the boundary.** Parse all form data, route params, and `searchParams` with Zod before use.
4. **The public menu must stay static + fast.** It is image-heavy and runs on cellular. Use ISR with
   tag-based revalidation; do not turn menu pages into per-request dynamic SSR.
5. **Never proxy file bytes through Next.** Uploads go browser → MinIO via presigned URL; reads go
   through imgproxy. → `.claude/skills/image-pipeline/SKILL.md`
6. **Secrets only via env** (validated in `lib/env.ts`). Never hardcode credentials, bucket names, or URLs.

---

## Rules (auto-loaded from `.claude/rules/`)

Every `.md` in `.claude/rules/` loads as project memory automatically — no import needed.
`00-core`, `security`, and `typescript` load unconditionally (apply to all code).
`data-fetching`, `redis`, and `styling-rtl` are **path-scoped** (a `paths:` frontmatter), so they only
enter context when you're editing matching files — keeping this root file lean.

---

## Skills (consult when relevant)

- **design-system** — shadcn/ui foundation (all surfaces), responsive layout, RTL, admin-only theming
  (light/dark/sepia, extensible), the Sheet drawer pattern for admin forms, react-hook-form + Server
  Actions. Consult before adding/editing any UI primitive, form, drawer, layout shell, or theme.
- **tenant-isolation** — any DB access for café-owned data; building the scoped Prisma client.
- **prisma-data-model** — adding/changing models, writing migrations, the canonical schema.
- **nextjs-conventions** — adding routes, Server Actions, RSC/client boundaries, ISR + revalidateTag.
- **auth-rbac** — auth setup, role guards, the platform vs café tiers, impersonation.
- **image-pipeline** — uploads, MinIO, imgproxy, blurhash, the `next/image` loader.
- **admin-resource** — scaffolding a new CRUD resource consistently across an admin surface.
- **menu-templates** — the public menu: three swappable templates (Warm/Scandi/Editorial), the registry
  + shared headless core + theming, with all three reference templates bundled. Consult before touching
  any customer-facing menu component.

---

## Directory map (target)

```
app/
  fonts/                          # self-hosted fonts (next/font/local): IRANYekan + Poppins + loader
  (public)/[cafeSlug]/            # public menu — renders café's chosen template (RSC, ISR)
    page.tsx  layout.tsx  item/[itemId]/…
  (cafe-admin)/                   # tenant dashboard
    dashboard/  menu/  staff/  settings/
  (platform)/                     # super-admin
    cafes/  plans/  users/
  api/                            # route handlers (webhooks, presign, health)
lib/
  db.ts            # base PrismaClient (singleton)
  tenant.ts        # getTenantPrisma(cafeId) — scoped client
  auth.ts          # Auth.js config + guards (requireSuperAdmin, requireCafeRole)
  env.ts           # zod-validated environment
  redis.ts         # ioredis client (rate limit, queues, shared cache)
  storage.ts       # MinIO/presign helpers
  image.ts         # imgproxy URL builder + blurhash
  utils.ts         # cn() (clsx + tailwind-merge) — shadcn class merge
  themes.ts        # admin theme registry (id+label); add a theme = one entry + one token block
  seed/            # bundled default menu (data.json + item_images/) + import-menu.ts (super-admin in-app seeder)
components/
  providers/       # ThemeProvider (next-themes, admin-only), ThemeSwitcher
  menu/
    types.ts         # MenuTemplateProps contract
    core/            # shared: ImageCarousel, FullscreenViewer, ItemDetailContent, ThemeScope, faNum
    templates/       # Warm.tsx, Scandi.tsx, Editorial.tsx (one renders per café; built on shadcn + cn)
    registry.ts      # MenuTemplate -> dynamic() component map
  admin/           # composed admin pieces (DataTable, drawer ResourceForm) on top of ui/
  ui/              # shadcn/ui primitives (owned source: button, input, sheet, dialog, form, …)
workers/           # BullMQ workers (e.g. image post-processing)
prisma/
  schema.prisma  migrations/
docker-compose.yml  Dockerfile     # local: next + postgres + redis + minio + imgproxy
```

---

## Commands

```bash
pnpm dev                         # next dev
pnpm build && pnpm start         # prod build
pnpm prisma migrate dev -n <name># create + apply migration (dev)
pnpm prisma migrate deploy       # apply migrations (prod/CI)
pnpm prisma studio               # inspect data
pnpm lint && pnpm typecheck      # must pass before commit
pnpm test                        # unit/integration
docker compose up -d             # next + postgres + redis + minio + imgproxy
```

## Conventions

- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`…). Branch: `feat/<scope>-<short>`.
- **Server Actions** live in `actions.ts` colocated with the route; each starts with a guard + Zod parse.
- **No `any`.** Prefer inferred types from Prisma + Zod. Share DTOs via `z.infer`.
- Before finishing a task: run `pnpm lint && pnpm typecheck` and, for schema changes, generate a migration.
- When unsure about tenancy, auth, or caching, STOP and re-read the matching skill rather than guessing.
