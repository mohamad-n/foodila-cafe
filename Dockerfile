# syntax=docker/dockerfile:1

# Café Menu SaaS — production image.
# Multi-stage: install (with dev deps) → build standalone → lean runtime (`node server.js`).
# Debian slim (not alpine) for friction-free Prisma engines + sharp native binaries.
#
# Build-time env below are throwaway placeholders so `prisma generate` (postinstall) can resolve
# prisma.config.ts and `next build` can pass lib/env.ts validation. They are NOT secrets and are NOT
# baked into the runtime (no NEXT_PUBLIC_*); the container reads real values from .env.production.

ARG NODE_IMAGE=node:24-bookworm-slim
ARG BUILD_DATABASE_URL="postgresql://build:build@localhost:5432/build"

# ---- deps: full install (incl dev) — also used by the one-shot migrate service ----
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
ARG BUILD_DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1 DATABASE_URL=${BUILD_DATABASE_URL}
RUN corepack enable
# Files needed before install: lockfile + the prisma schema/config the `postinstall` generate reads.
COPY package.json pnpm-lock.yaml .npmrc prisma.config.ts ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ---- builder: compile the Next standalone server ----
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ARG BUILD_DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The generated Prisma client lives in lib/generated (dockerignored) — bring it over from deps.
COPY --from=deps /app/lib/generated ./lib/generated
# Schema-valid placeholders for `next build` (lib/env validates at import). generateStaticParams also
# tolerates the unreachable DB here (falls back to ISR — see the public page).
ENV DATABASE_URL=${BUILD_DATABASE_URL} \
    AUTH_SECRET="build-time-placeholder" \
    MINIO_ENDPOINT="http://localhost:9000" \
    MINIO_ACCESS_KEY="build" \
    MINIO_SECRET_KEY="build" \
    MINIO_BUCKET="build" \
    IMGPROXY_URL="http://localhost:8080" \
    IMGPROXY_KEY="00" \
    IMGPROXY_SALT="00"
RUN pnpm build

# ---- runner: minimal runtime ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs
# Standalone bundle (server.js + traced node_modules + traced lib/seed assets), then static assets.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
