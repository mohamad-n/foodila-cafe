---
name: tenant-isolation
description: >
  How to safely read and write café-owned (tenant) data in this multi-tenant SaaS. ALWAYS consult this
  skill before writing any Prisma query, mutation, or Server Action that touches café data (Category,
  Item, ItemImage, Membership, etc.), and whenever building or changing the tenant-scoped Prisma client.
  Use it even if the request seems simple — a missing cafeId filter is a cross-tenant data leak. Trigger
  on: "add a query", "fetch items", "create/update/delete" anything café-owned, "scoped prisma", "RLS".
---

# Tenant isolation

This is a shared-database, shared-schema multi-tenant app. Every tenant-owned row has a `cafeId`.
The #1 risk is leaking or writing across tenants. This skill makes that structurally hard.

## The rule

> Tenant-owned data is **only** accessed through the tenant-scoped Prisma client bound to a single
> `cafeId`. The base client (`lib/db.ts`) is reserved for non-tenant tables (`User`, `Cafe`, `Plan`)
> and platform/super-admin operations.

## The scoped client (`lib/tenant.ts`)

Build a client that auto-injects `cafeId` and forbids cross-tenant access using Prisma `$extends`:

```ts
import "server-only";
import { prisma } from "@/lib/db";

const TENANT_MODELS = ["category", "item", "itemImage", "membership"] as const;

export function getTenantPrisma(cafeId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const m = model?.charAt(0).toLowerCase() + model!.slice(1);
          if (!TENANT_MODELS.includes(m as any)) return query(args);

          // reads
          if (operation.startsWith("find") || operation === "count" || operation === "aggregate" || operation === "groupBy") {
            args.where = { ...(args.where ?? {}), cafeId };
          }
          // creates
          if (operation === "create") args.data = { ...args.data, cafeId };
          if (operation === "createMany") {
            const rows = Array.isArray(args.data) ? args.data : [args.data];
            args.data = rows.map((r: any) => ({ ...r, cafeId }));
          }
          // updates / deletes / upserts — constrain by cafeId so you can never touch another tenant
          if (["update", "updateMany", "delete", "deleteMany"].includes(operation)) {
            args.where = { ...(args.where ?? {}), cafeId };
          }
          if (operation === "upsert") {
            args.where = { ...(args.where ?? {}), cafeId };
            args.create = { ...args.create, cafeId };
          }
          return query(args);
        },
      },
    },
  });
}
```

## How to use it

```ts
// In a café-admin Server Action or RSC loader, AFTER the role guard:
const { cafeId } = await requireCafeRole(targetCafeId, ["OWNER", "ADMIN", "STAFF"]);
const db = getTenantPrisma(cafeId);
const items = await db.item.findMany({ where: { categoryId }, orderBy: { sortOrder: "asc" } });
```

- `cafeId` is resolved from the **session/Membership**, never from client input or `[cafeSlug]`.
- For the **public menu**, resolve the `Cafe` by slug with the base client, then read its menu with
  `getTenantPrisma(cafe.id)` — the slug→id lookup is the only tenant-resolution that uses a URL value,
  and it grants read of public menu data only.

## Hard don'ts

- ❌ `prisma.item.findMany(...)` anywhere for tenant data. Use `getTenantPrisma`.
- ❌ Accepting `cafeId` from a form field or query param to decide *which* tenant to mutate.
- ❌ Cross-tenant joins. If you think you need one, it's a platform/super-admin operation — handle it in
  the `(platform)` surface with explicit, logged super-admin authz, not the scoped client.

## Defense in depth (later)

When traffic/compliance warrants, add PostgreSQL **Row-Level Security**: a `cafe_id` policy keyed off a
session GUC (`SET app.current_cafe`). The scoped client stays; RLS becomes a second wall. Don't add it
until there's a concrete need (see core rules — no premature abstraction).

## Checklist before finishing any tenant data task

- [ ] Used `getTenantPrisma(cafeId)`, not the base client.
- [ ] `cafeId` came from session/Membership (or public slug lookup for read-only menu).
- [ ] A role guard ran before the write.
- [ ] New tenant tables have `cafeId` + a composite index starting with `cafeId`.
