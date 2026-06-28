#!/usr/bin/env bash
# One-time TLS bootstrap for the production stack. Issues a single Let's Encrypt SAN certificate
# covering DOMAIN, CDN_HOST and S3_HOST, then reloads nginx to use it.
#
# Prereqs: .env.production filled in, DNS A records (apex + cdn + s3) already pointing at this host,
#          ports 80/443 open. Run from the repo root:  bash nginx/init-letsencrypt.sh
#
# Re-runnable: pass STAGING=1 first to test against Let's Encrypt staging and avoid rate limits.
set -euo pipefail

ENV_FILE=".env.production"
COMPOSE="docker compose --env-file ${ENV_FILE} -f docker-compose.prod.yml"
CERT_DIR="./nginx/certbot/conf"
WEBROOT="./nginx/certbot/www"

[ -f "${ENV_FILE}" ] || { echo "Missing ${ENV_FILE} (copy .env.production.example)."; exit 1; }
set -a; . "./${ENV_FILE}"; set +a
: "${DOMAIN:?set DOMAIN in ${ENV_FILE}}"
: "${CDN_HOST:?set CDN_HOST}"
: "${S3_HOST:?set S3_HOST}"
: "${CERTBOT_EMAIL:?set CERTBOT_EMAIL}"

STAGING="${STAGING:-0}"
LIVE="${CERT_DIR}/live/${DOMAIN}"

mkdir -p "${CERT_DIR}" "${WEBROOT}"

# Recommended TLS params referenced by the nginx config.
if [ ! -e "${CERT_DIR}/options-ssl-nginx.conf" ] || [ ! -e "${CERT_DIR}/ssl-dhparams.pem" ]; then
  echo "### Fetching recommended TLS parameters…"
  curl -sSL https://raw.githubusercontent.com/certbot/certbot/main/certbot-nginx/src/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "${CERT_DIR}/options-ssl-nginx.conf"
  curl -sSL https://raw.githubusercontent.com/certbot/certbot/main/certbot/certbot/ssl-dhparams.pem > "${CERT_DIR}/ssl-dhparams.pem"
fi

# 1) Dummy self-signed cert so nginx can start and serve the ACME challenge over :80.
# The certbot image's ENTRYPOINT is `certbot`, so we override it to a shell to run openssl/rm.
echo "### Creating a temporary self-signed certificate for ${DOMAIN}…"
mkdir -p "${LIVE}"
docker run --rm -v "$(pwd)/${CERT_DIR}:/etc/letsencrypt" \
  --entrypoint sh certbot/certbot \
  -c "openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout '/etc/letsencrypt/live/${DOMAIN}/privkey.pem' \
    -out '/etc/letsencrypt/live/${DOMAIN}/fullchain.pem' \
    -subj '/CN=${DOMAIN}'"

# 2) Bring up nginx (it now has a cert to load).
echo "### Starting nginx…"
${COMPOSE} up -d nginx

# 3) Drop the dummy and request the real certificate via the webroot challenge.
echo "### Deleting the temporary certificate…"
docker run --rm -v "$(pwd)/${CERT_DIR}:/etc/letsencrypt" \
  --entrypoint sh certbot/certbot \
  -c "rm -rf /etc/letsencrypt/live/${DOMAIN} /etc/letsencrypt/archive/${DOMAIN} /etc/letsencrypt/renewal/${DOMAIN}.conf"

STAGING_FLAG=""
[ "${STAGING}" != "0" ] && STAGING_FLAG="--staging"

echo "### Requesting the Let's Encrypt certificate…"
# Override the compose service's renew-loop entrypoint with plain `certbot`; the subcommand follows.
${COMPOSE} run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot ${STAGING_FLAG} \
    --email "${CERTBOT_EMAIL}" --agree-tos --no-eff-email --force-renewal \
    -d "${DOMAIN}" -d "${CDN_HOST}" -d "${S3_HOST}"

# 4) Reload nginx with the real certificate.
echo "### Reloading nginx…"
${COMPOSE} exec nginx nginx -s reload

echo "### Done. TLS is live for ${DOMAIN}, ${CDN_HOST}, ${S3_HOST}."
