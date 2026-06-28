# Deployment — Ubuntu 22.04 / 24.04

Single-host deployment with Docker Compose. **nginx** is the only public service and reverse-proxies
to three internal services:

| Public hostname | → internal service | purpose |
|---|---|---|
| `foodila.ir` | `app:3000` | the Next.js app (admin + public menu) |
| `cdn.foodila.ir` | `imgproxy:8080` | signed image transforms (image `src`s) |
| `s3.foodila.ir` | `minio:9000` | browser **presigned uploads** (never proxied through Next) |

Postgres, MinIO, and imgproxy are **not** exposed to the internet. TLS is Let's Encrypt (auto-renewing).

> Domain is **foodila.ir** (apex + `cdn.` + `s3.`). DNS is managed by your external provider.

---

## 1. Server prerequisites

- Ubuntu 22.04 or 24.04, 2 vCPU / 4 GB RAM minimum (image processing + Postgres + MinIO), a public IP.
- A non-root sudo user.

## 2. DNS (do this first — certs need it)

At your DNS provider create three **A records**, all pointing at the server's public IP:

```
foodila.ir        A   <server-ip>
cdn.foodila.ir    A   <server-ip>
s3.foodila.ir     A   <server-ip>
```

Wait for them to resolve (`dig +short foodila.ir`) before requesting certificates.

## 3. Install Docker Engine + Compose plugin

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"   # log out/in afterwards so `docker` works without sudo
```

## 4. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 4b. Coexisting with other stacks on the same host

This server already runs other Docker stacks (e.g. `elitera-*`, `metabase`, standalone `postgres`).
That's fine — **this stack only publishes ports `80` and `443`** (via nginx). Its Postgres, MinIO, and
imgproxy stay on this project's **private** Docker network and are never bound to host ports, so they
can't collide with the existing `minio` (9000/9001), the two Postgres (5432/5433), or metabase (3000).
Compose also scopes service names per project, so our internal `postgres`/`minio`/`app` names don't
clash with theirs.

The **only** requirement is that `80`/`443` are free. Confirm before bringing up nginx:

```bash
sudo ss -ltnp '( sport = :80 or sport = :443 )'
```

If that prints nothing, you're clear. If something is already listening (a host nginx/caddy, or another
container), you must free those ports — this stack terminates TLS for all three `foodila.ir` hostnames
itself and needs to own 80/443. Don't also point an existing host-level reverse proxy at the app
container; pick one TLS terminator.

## 5. Clone + configure

```bash
git clone <your-repo-url> cafe-menu-saas && cd cafe-menu-saas
cp .env.production.example .env.production
nano .env.production         # domain is pre-filled (foodila.ir); set CERTBOT_EMAIL + ALL secrets
```

Generate the secrets the file asks for:

```bash
openssl rand -base64 32   # AUTH_SECRET, POSTGRES_PASSWORD, MINIO passwords
openssl rand -hex 32      # IMGPROXY_KEY, IMGPROXY_SALT
```

Make sure `DATABASE_URL`'s password matches `POSTGRES_PASSWORD`, and `MINIO_ACCESS_KEY/SECRET_KEY`
match the MinIO root creds (or a scoped key you create).

> Tip: add an alias so you don't retype the compose flags:
> ```bash
> echo "alias dcp='docker compose --env-file .env.production -f docker-compose.prod.yml'" >> ~/.bashrc && source ~/.bashrc
> ```
> The rest of this guide uses `dcp`.

## 6. Build images

```bash
dcp build
```

## 7. Issue TLS certificates (one time)

This starts datastores + nginx and obtains the Let's Encrypt SAN cert for all three hostnames:

```bash
dcp up -d postgres minio
bash nginx/init-letsencrypt.sh          # add STAGING=1 in front to dry-run against LE staging first
```

If it succeeds you'll see *“TLS is live for foodila.ir, cdn.foodila.ir, s3.foodila.ir.”*

## 8. Start the whole stack

```bash
dcp up -d
```

On startup the `migrate` service runs `prisma migrate deploy` (applies pending migrations) and the
`app` waits for it. Check everything is healthy:

```bash
dcp ps
dcp logs -f app          # Ctrl-C to stop following
```

## 9. Bootstrap an admin account

Create the first platform super-admin (and demo café) by running the seed once:

```bash
dcp run --rm migrate pnpm db:seed
```

This creates `admin@platform.local` (password `password123`) plus a demo café. **Log in at
`https://foodila.ir/login` and change the password immediately**, then delete the demo data you don't
want. (Café menus can be populated from the platform admin → café → «منوی پیش‌فرض» seed action.)

## 10. Verify

- `https://foodila.ir` → the app loads over HTTPS (valid cert).
- Log in, open a café, upload an item photo → it stores (browser → `s3.foodila.ir`) and renders
  (via `cdn.foodila.ir`). If uploads fail, see *Troubleshooting → CORS* below.

---

## Updating / redeploying

```bash
cd cafe-menu-saas
git pull
dcp build
dcp up -d            # migrate runs automatically; only changed services restart
```

## Backups

**Postgres** (source of truth):
```bash
dcp exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > backup-$(date +%F).sql.gz
# restore:  gunzip -c backup.sql.gz | dcp exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

**MinIO objects** (uploaded photos) live in the `minio-data` Docker volume — snapshot it, or mirror
the bucket out with `mc` periodically.

## Operations cheatsheet

```bash
dcp ps                       # status
dcp logs -f <service>        # tail logs (app | nginx | imgproxy | postgres | minio | certbot)
dcp restart app
dcp exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
dcp down                     # stop (keeps volumes/data)
```

## Troubleshooting

- **Cert request fails** — DNS must resolve to this host and ports 80/443 must be open *before*
  running `init-letsencrypt.sh`. Re-run with `STAGING=1` to avoid hitting LE rate limits while testing.
- **nginx won't start (no cert)** — run step 7; nginx needs the cert under
  `nginx/certbot/conf/live/foodila.ir/`.
- **Uploads fail with a CORS error** — the browser PUTs to `s3.foodila.ir`. MinIO emits its own CORS
  headers; if your provider/setup strips them, set an allowed origin on the bucket with `mc`:
  `dcp run --rm createbuckets sh -c "mc alias set local http://minio:9000 \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD && mc cors set local/\$MINIO_BUCKET <(echo '{...}')"`.
- **Images don't render** — check `dcp logs imgproxy`; verify `IMGPROXY_URL=https://cdn.foodila.ir`
  and that `IMGPROXY_KEY/SALT` in `.env.production` match what the app signs with (same file, so they do).
- **`migrate` exits non-zero** — inspect `dcp logs migrate`; usually a wrong `DATABASE_URL`
  (host must be `postgres`, port `5432`).

## Notes

- **NODE_ENV** is set to `production` in `.env.production` and validated in `lib/env.ts`; the Docker
  runtime also exports it. Locally, `pnpm dev` stays `development`.
- **No Redis** in this stack (single instance, in-memory rate-limiting). Add it when scaling to
  multiple app instances — see `.claude/rules/redis.md`.
- A stricter **Content-Security-Policy** can be added in `nginx/templates/default.conf.template` on the
  app server block once you confirm the allowed origins (`cdn.` for images, `s3.` for upload `connect-src`).
