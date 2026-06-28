---
paths:
  - "app/**"
  - "lib/**"
---

# Data fetching & caching

The public menu is the performance-critical path: image-heavy, opened on cellular, must feel instant.

- **Public menu = static + ISR.** Generate menu pages with `generateStaticParams` over active café slugs;
  revalidate on demand. Tag cached reads with `menu:{cafeId}` and `cafe:{cafeId}`.
- **Mutations revalidate by tag.** After any café-admin write, call `revalidateTag("menu:"+cafeId)` so the
  public page refreshes within seconds without a redeploy. Avoid `revalidatePath` for cross-surface updates.
- **Volatile-only on the client.** If "sold out" must reflect instantly, fetch just that flag client-side
  or use a very short revalidate — do not make the whole page dynamic.
- **Fetch in parallel.** Kick off independent queries together (`Promise.all`) in RSC; never `await` in a
  loop or chain queries that could run concurrently.
- **Select only what you render.** Use Prisma `select`/`include` deliberately; never `findMany()` a tenant
  table without `where: { cafeId }` and pagination/sort.
- **Admin surfaces** can be dynamic (per-request) — they are authenticated and low-traffic. Do not cache
  authenticated admin data across users.
- Keep images out of the JS payload: serve via imgproxy through the `next/image` loader with `sizes` set
  for the snap-feed (near full-viewport) layout, plus blurhash `placeholder`.
