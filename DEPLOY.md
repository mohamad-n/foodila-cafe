# Deployment — Ubuntu 22.04 / 24.04

Single-host deployment with Docker Compose. **This server already runs nginx** (for other apps), so that
**host nginx** is the TLS-terminating reverse proxy (Plan B). The stack publishes each upstream on
`127.0.0.1` and the host nginx proxies three hostnames to them:

| Public hostname | host nginx → | container | purpose |
|---|---|---|---|
| `foodila.ir` | `127.0.0.1:3100` | app | the Next.js app (admin + public menu) |
| `cdn.foodila.ir` | `127.0.0.1:8100` | imgproxy | signed image transforms (image `src`s) |
| `s3.foodila.ir` | `127.0.0.1:9100` | MinIO | browser **presigned uploads** (never proxied through Next) |

Postgres, MinIO, and imgproxy bind **localhost only** — never the public interface. TLS is issued by the
**host** certbot. Ports are `APP_HOST_PORT` / `IMGPROXY_HOST_PORT` / `S3_HOST_PORT` in `.env.production`.

> Domain is **foodila.ir** (apex + `cdn.` + `s3.`). DNS is managed by your external provider.
>
> **No host nginx?** A fully self-contained edge (Dockerized nginx + certbot owning 80/443) is available
> as an opt-in — see [Alternative: bundled edge](#alternative-bundled-edge-no-host-nginx) at the bottom.

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

## 4b. Coexisting with the existing host nginx + other stacks

This server already runs **host nginx** plus other Docker stacks (`elitera-*`, `metabase`, standalone
`postgres`). We **reuse the host nginx** as the TLS edge rather than adding a second one. This stack:

- publishes only **three localhost ports** — `127.0.0.1:3100` (app), `:8100` (imgproxy), `:9100` (MinIO) —
  never the public interface;
- keeps Postgres/MinIO/imgproxy on its **private** Docker network for inter-container traffic, with
  per-project service names, so nothing collides with the existing `minio` (9000/9001), the two Postgres
  (5432/5433), or metabase (3000).

Confirm the three localhost ports are free (override `*_HOST_PORT` in `.env.production` if not):

```bash
sudo ss -ltnp '( sport = :3100 or sport = :8100 or sport = :9100 )'   # expect no output
```

The host nginx keeps owning `80`/`443`; in step 8 we just **add a site config** to it. Do **not** start
the bundled Docker nginx (it's off by default; only `--profile bundled-edge` would start it).

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

Make sure `DATABASE_URL`'s password matches `POSTGRES_PASSWORD`.

> ⚠️ **MinIO creds must be identical pairs:** `MINIO_ACCESS_KEY` = `MINIO_ROOT_USER` **and**
> `MINIO_SECRET_KEY` = `MINIO_ROOT_PASSWORD` (the exact same strings). `MINIO_ROOT_*` is what the MinIO
> *server* boots with; `MINIO_*_KEY` is what the *app* and *imgproxy* sign with. If they differ you get
> upload `403`s and "Source is unreachable" on images. After any change to these, recreate **all**
> consumers: `dcp up -d --force-recreate minio app imgproxy`.

> Tip: add an alias so you don't retype the compose flags:
> ```bash
> echo "alias dcp='docker compose --env-file .env.production -f docker-compose.prod.yml'" >> ~/.bashrc && source ~/.bashrc
> ```
> The rest of this guide uses `dcp`.

## 6. Build images

```bash
dcp build
```

## 7. Start the stack (on localhost)

```bash
dcp up -d
```

This brings up Postgres, MinIO, imgproxy, the one-shot `migrate` (runs `prisma migrate deploy`; `app`
waits for it), and `app` — all on the three `127.0.0.1` ports. Nothing is public yet. Check health:

```bash
dcp ps
curl -I http://127.0.0.1:3100        # app should answer (200/307)
dcp logs -f app                      # Ctrl-C to stop following
```

## 8. Host nginx site config + TLS (one time)

Install the provided site config into the **existing** host nginx and issue certs with the host certbot:

```bash
# 1) install the reverse-proxy config (foodila.ir / cdn. / s3. → the localhost ports)
sudo cp nginx/host/foodila.ir.conf /etc/nginx/sites-available/foodila.ir.conf
sudo ln -s /etc/nginx/sites-available/foodila.ir.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx     # serves the three names over :80

# 2) issue + wire TLS (certbot rewrites the config to add :443 + an HTTP→HTTPS redirect)
sudo apt-get install -y certbot python3-certbot-nginx     # if not already installed
sudo certbot --nginx -d foodila.ir -d cdn.foodila.ir -d s3.foodila.ir \
  --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --redirect
```

certbot installs a renewal timer automatically (`systemctl list-timers | grep certbot`).

> **If host nginx uses `conf.d/` instead of `sites-enabled/`** (no symlink step), copy to
> `/etc/nginx/conf.d/foodila.ir.conf` instead.
> **If another site already defines a `$connection_upgrade` map**, delete that `map {…}` block from the
> top of `foodila.ir.conf` (nginx allows only one per `http{}`).

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
dcp logs -f <service>        # tail logs (app | imgproxy | postgres | minio | migrate)
dcp restart app
dcp exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
dcp down                     # stop (keeps volumes/data)
sudo systemctl reload nginx  # host nginx — after editing foodila.ir.conf
```

## Troubleshooting

- **502 from foodila.ir** — host nginx can't reach the app. Check `curl -I http://127.0.0.1:3100` and
  `dcp ps`; confirm `proxy_pass` ports in `foodila.ir.conf` match `*_HOST_PORT`.
- **Cert request fails** — DNS for all three names must resolve to this host *before* `certbot --nginx`;
  the host nginx must already serve them on `:80`. Add `--dry-run` to test without hitting LE rate limits.
- **Uploads 403 AND/OR images "Source is unreachable"** — MinIO credential mismatch. `MINIO_SECRET_KEY`
  must equal `MINIO_ROOT_PASSWORD` (and `MINIO_ACCESS_KEY` = `MINIO_ROOT_USER`); MinIO logs the giveaway
  *"MINIO_ACCESS_KEY/SECRET_KEY are deprecated"*. Fix the pairs in `.env.production`, then recreate **every**
  consumer (app + imgproxy both sign with these): `dcp up -d --force-recreate minio app imgproxy`. A common
  trap: recreating only `minio app` leaves `imgproxy` on the old secret → uploads work but images don't.
- **Uploads 403 / SignatureDoesNotMatch (creds are correct)** — then it's the host header: nginx must pass
  `Host` **unchanged** to MinIO (`proxy_set_header Host $host;`, already in `foodila.ir.conf`). Any Host/URI
  rewrite breaks SigV4. Also: the AWS SDK's default CRC32 checksum is disabled in `lib/storage.ts`
  (`requestChecksumCalculation: "WHEN_REQUIRED"`) — required for MinIO presigned PUTs.
- **Uploads fail with a CORS error** — the browser PUTs to `s3.foodila.ir`. MinIO emits its own CORS
  headers; if stripped, set an allowed origin on the bucket with `mc`:
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
- A stricter **Content-Security-Policy** can be added to the app `server {}` block in
  `nginx/host/foodila.ir.conf` once you confirm the allowed origins (`cdn.` for images, `s3.` for
  upload `connect-src`).

---

## Alternative: bundled edge (no host nginx)

If you deploy on a **fresh host with nothing on 80/443**, the stack can run its own Dockerized nginx +
certbot instead of a host nginx. It's opt-in via the `bundled-edge` compose profile:

```bash
dcp up -d postgres minio
bash nginx/init-letsencrypt.sh                       # issues the LE SAN cert (STAGING=1 to dry-run)
dcp --profile bundled-edge up -d                     # starts everything incl. the Docker nginx (80/443)
```

In this mode the Docker nginx owns 80/443 and proxies `app`/`imgproxy`/`minio` over the compose network
(the localhost `*_HOST_PORT` publishes are harmless/unused). Don't mix the two — pick host nginx **or**
the bundled edge, not both.
