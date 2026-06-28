---
name: nextjs-conventions
description: >
  How to add and structure code in this Next.js App Router app: route groups, Server Components vs client
  components, Server Actions for mutations, Route Handlers, and ISR + tag-based revalidation. ALWAYS
  consult this skill when adding a page/route/layout, writing a Server Action, deciding RSC vs "use
  client", wiring caching/revalidation, or touching the public menu's static generation. Trigger on:
  "add a page", "new route", "server action", "make it dynamic/static", "revalidate", "ISR", "API route".
---

# Next.js conventions

App Router, RSC-first, TypeScript strict. Three route groups with different auth + caching (see CLAUDE.md).

## Where things go

```
app/(public)/[cafeSlug]/page.tsx        # menu — static + ISR, no auth
app/(public)/[cafeSlug]/item/[itemId]/page.tsx
app/(cafe-admin)/menu/page.tsx          # tenant dashboard — dynamic, Membership-guarded
app/(cafe-admin)/menu/actions.ts        # Server Actions colocated
app/(platform)/cafes/page.tsx           # super-admin — dynamic, SUPER_ADMIN-guarded
app/api/presign/route.ts                # Route Handler (presigned upload)
```

## RSC vs client

- **Default = Server Component.** Do data fetching, auth, and Prisma access here.
- Add `"use client"` only for interactivity: the Étude 3 snap feed/carousel/fullscreen, admin forms,
  availability toggles. Keep client components leaf-level and prop-driven; never import server-only
  modules (`lib/db`, `lib/auth`, `lib/storage`) into them.
- Pass server data down as serializable props. Don't fetch in client components what the server can fetch.

## Mutations = Server Actions (the standard shape)

```ts
"use server";
import { z } from "zod";
import { requireCafeRole } from "@/lib/auth";
import { getTenantPrisma } from "@/lib/tenant";
import { revalidateTag } from "next/cache";

const Input = z.object({ cafeId: z.string(), categoryId: z.string(), nameFa: z.string().min(1), calories: z.coerce.number().int().nonnegative().optional() });

export async function createItem(formData: FormData) {
  const input = Input.parse(Object.fromEntries(formData));          // 1) validate
  const { cafeId } = await requireCafeRole(input.cafeId, ["OWNER","ADMIN","STAFF"]); // 2) authz
  const db = getTenantPrisma(cafeId);                                // 3) scoped write
  await db.item.create({ data: { categoryId: input.categoryId, name: { fa: input.nameFa }, calories: input.calories } });
  revalidateTag(`menu:${cafeId}`);                                   // 4) refresh public menu
}
```

Every action follows **validate → authorize → scoped write → revalidate**. Return user-safe results;
never throw raw Prisma errors to the client.

## Route Handlers (`app/api/*`)

Use only for: presigned-upload issuing, webhooks (billing later), and `GET /api/health`. Everything
user-facing that mutates app data is a Server Action, not a fetch to an API route.

## Caching / ISR (public menu is the hot path)

- `generateStaticParams` over **active** café slugs; set a sane `revalidate` and tag reads:
  ```ts
  export const revalidate = 3600;
  // tag fetches/Prisma reads logically with cacheTag(`menu:${cafe.id}`)
  ```
- Café-admin writes call `revalidateTag("menu:"+cafeId)` → public page updates in seconds, no redeploy.
- Need instant "sold out"? Fetch just that boolean client-side or use a tiny `revalidate`; don't make the
  whole menu page dynamic. See `.claude/rules/data-fetching.md`.
- Admin pages are dynamic (`export const dynamic = "force-dynamic"` where appropriate) — never shared-cached.

## Middleware

`middleware.ts` resolves tenant context for routing and gates `(cafe-admin)` / `(platform)` by session.
Keep it thin (no DB calls beyond a cached session check); deep authz lives in the guards.

## Checklist

- [ ] Correct route group for the surface (auth + caching match).
- [ ] Server Component unless interactivity requires client.
- [ ] Mutation = Server Action with validate→authorize→scoped→revalidate.
- [ ] Public menu stays static/ISR; revalidation tagged by `cafeId`.
