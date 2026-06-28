---
paths:
  - "lib/**"
  - "workers/**"
  - "app/api/**"
---

# Redis

Redis is part of the stack. It is a **supporting** store — Postgres remains the single source of truth.
Use one client (`ioredis`) from `lib/redis.ts`, configured from validated env.

## Sanctioned uses

- **Rate limiting** — auth (login/signup), the presign endpoint, and any public write path. Sliding-window
  or token-bucket keyed by IP and/or user. Reject early before touching the DB.
- **Background jobs (BullMQ)** — offload image post-processing (probe dimensions + blurhash) from the
  upload request when uploads are bulky/bulk. The Server Action enqueues; a worker writes the `ItemImage`
  row via the scoped client and revalidates `menu:{cafeId}`. (For single small uploads, inline is fine —
  don't queue prematurely.)
- **Shared ISR/data cache (multi-instance)** — back Next.js's cache handler with Redis so ISR pages and
  `revalidateTag` stay consistent across multiple app instances. Tag keys by `menu:{cafeId}` / `cafe:{cafeId}`.
- **Ephemeral counters / short-TTL locks** — e.g., dedupe concurrent revalidations, simple menu-view
  counters (flush to Postgres later).

## Boundaries

- ❌ **Not a database.** No tenant data, menu content, or anything that must survive a flush lives only in
  Redis. Everything durable is in Postgres; Redis entries carry TTLs and are rebuildable.
- ❌ Not the session store by default — Auth.js uses JWT here. Only introduce Redis sessions if you switch
  to server-side sessions, and say so explicitly.
- **Tenant-namespace every key**: `rl:{ip}`, `cache:menu:{cafeId}`, `q:image:{cafeId}`, etc. Never mix tenants.
- Treat Redis as best-effort: handle connection loss gracefully (fail open for caching, fail safe for
  rate limits → deny or fall back to a conservative limit). Never let a Redis outage take down menu reads.
- Keep usage lean — add a new Redis responsibility only when there's a concrete need, not speculatively.
