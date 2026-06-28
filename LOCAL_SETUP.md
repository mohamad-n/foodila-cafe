# Running Locally — Setup & Test Guide

Step-by-step instructions to run the Café Menu SaaS on your machine and exercise all three
surfaces (public menu, café admin, platform admin).

> **Package manager is pnpm — only.** `npm`/`yarn` are blocked by a `preinstall` guard.
> **Node 24** is required (Prisma 7). Run every command in a shell where `node -v` is ≥ 24.

---

## 1. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | ≥ 24 (project pins **24.18.0** in `.nvmrc`) | `node -v` |
| pnpm | ≥ 10 (pinned **10.33.2**) | `pnpm -v` |
| Docker + Docker Compose | any recent | `docker compose version` |

**Use the pinned Node** (the machine default is older):

```bash
nvm install   # reads .nvmrc → installs 24.18.0
nvm use       # switch this shell to 24.18.0
node -v       # must print v24.x
```

If you don't have pnpm: `corepack enable && corepack prepare pnpm@10.33.2 --activate`.

> Every command below assumes a shell where `nvm use` has already selected Node 24.

---

## 2. Start backing services (Postgres, MinIO, imgproxy)

The Next.js app runs on the host; its infrastructure runs in Docker. Ports are remapped high to
avoid clashing with other local services.

```bash
docker compose up -d
```

This brings up:

| Service | Host port | Purpose |
|---|---|---|
| postgres | **5455** | shared database (tenant data separated by `cafeId`) |
| minio (S3 API) | **9410** | object storage for menu photos |
| minio (console) | **9411** | web UI — login `minioadmin` / `minioadmin` |
| imgproxy | **8810** | on-the-fly AVIF/WebP/resize in front of MinIO |

> These host ports were picked clear of the many services already running on this machine
> (Postgres on 5432–5447, MinIO on 9000/9001, etc.). Containers map to standard ports
> internally; only the host side is remapped. If any still clashes on your machine, change the
> left-hand number in `docker-compose.yml` and the matching URL in `.env`.

A one-shot `createbuckets` container creates the `cafe-menu` bucket and exits — that's expected.

Verify everything is healthy:

```bash
docker compose ps          # postgres + minio should be "healthy"
```

---

## 3. Configure environment

Copy the example env and generate an auth secret:

```bash
cp .env.example .env
```

Then set `AUTH_SECRET` in `.env` (the only value you must fill in):

```bash
# generate a value and paste it into AUTH_SECRET="..."
openssl rand -base64 32
```

Every other value in `.env.example` already matches `docker-compose.yml`, so the rest works as-is
for local dev.

---

## 4. Install dependencies

```bash
pnpm install
```

`postinstall` runs `prisma generate` automatically, emitting the typed client to
`lib/generated/prisma`.

---

## 5. Create the database schema + seed data

```bash
pnpm db:deploy   # applies migrations to the running Postgres
pnpm db:seed     # inserts a demo café, users, and a small menu
```

> If you change `prisma/schema.prisma` later, use `pnpm db:migrate` (creates a new migration in
> dev). **Prisma 7's `migrate dev` does NOT auto-run `generate`** — follow a schema change with
> `pnpm exec prisma generate` before typechecking.

### Seeded logins (password for all: `password123`)

| Email | Role | Lands on |
|---|---|---|
| `owner@darya.cafe` | Café **OWNER** of "کافه دریا" | `/dashboard` |
| `staff@darya.cafe` | Café **STAFF** | `/dashboard` |
| `admin@platform.local` | Platform **SUPER_ADMIN** | `/cafes` |

The demo café's public slug is **`darya`**.

---

## 6. Run the app

```bash
pnpm dev
```

Open <http://localhost:4055>.

---

## 7. Walk through the three surfaces

### Public menu (no auth)
- Visit <http://localhost:4055/darya> — the immersive RTL menu, rendered with the café's chosen
  template (Editorial by default). It's statically generated + ISR-cached; images come signed
  through imgproxy.

### Café admin (sign in as owner/staff)
1. Go to <http://localhost:4055/login>, sign in as `owner@darya.cafe` / `password123`.
2. **`/menu`** — add/edit categories and items, toggle availability, upload item photos
   (browser → MinIO presigned PUT → blurhash placeholder). Changes revalidate the public menu.
3. **`/dashboard`** — café overview.

### Platform admin (sign in as super-admin)
1. Sign in as `admin@platform.local` / `password123`.
2. **`/cafes`** — create cafés (creates café + owner user + OWNER membership in one transaction),
   edit, suspend, and **impersonate** a café.
3. **`/users`** — promote/demote super-admins. **`/plans`** — minimal plan CRUD.
4. When impersonating, a gold band appears in the café-admin shell with «پایان جانشینی» to exit.

---

## 8. Quality gates (run before committing)

```bash
pnpm typecheck      # tsc --noEmit, strict
pnpm lint           # next lint
pnpm format:check   # prettier
pnpm build          # full production build (catches RSC/route issues)
```

> `pnpm test` is currently a placeholder (a real test runner is a tracked follow-up).

To test a production build locally:

```bash
pnpm build && pnpm start    # serves on http://localhost:4055
```

---

## 9. Useful operations

```bash
pnpm prisma:studio                       # browse/edit data in a GUI
docker compose logs -f imgproxy          # tail a service's logs
docker compose down                      # stop services (keeps data volumes)
docker compose down -v                   # stop AND wipe Postgres + MinIO data
```

---

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| `only-allow pnpm` error on install | You used npm/yarn — use `pnpm install`. |
| Prisma/engine errors mentioning Node version | Wrong Node — run `nvm use` (need ≥ 24). |
| `Can't reach database server` | Services not up / wrong port — `docker compose ps`; Postgres is on **5455**. |
| Env validation throws at boot | A required var is missing in `.env` — most often empty `AUTH_SECRET`. |
| Menu images 404 / don't load | MinIO or imgproxy down, or bucket missing — check `docker compose ps` and the `createbuckets` log. |
| `auditLog` / model type errors after a schema edit | Run `pnpm exec prisma generate` (Prisma 7 `migrate dev` doesn't auto-generate). |
| Port already in use (4055/5455/9410/9411/8810) | Stop the conflicting process or remap the host port in `docker-compose.yml` + `.env`. |
