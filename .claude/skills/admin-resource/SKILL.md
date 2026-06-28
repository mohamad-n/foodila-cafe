---
name: admin-resource
description: >
  The standard recipe for scaffolding a CRUD resource consistently across the café-admin and platform
  admin surfaces (list + create/edit form + Server Actions + Zod schema), with the right guard and
  revalidation for each surface. ALWAYS consult this skill when adding or modifying an admin management
  screen — categories, items, staff/members, cafés, plans, settings. Trigger on: "add an admin page for
  X", "CRUD for X", "manage X in the dashboard", "list/create/edit/delete X", "admin form/table".
---

# Admin resource recipe

A repeatable pattern so every management screen looks and behaves the same and never skips authz,
validation, tenant-scoping, or revalidation.

> **UI:** all admin screens are built on **shadcn/ui**, responsive, with create/edit forms in a
> slide-out **`Sheet`** drawer and **react-hook-form + zodResolver** wired to the Server Action. See the
> `design-system` skill for the component/drawer/form/theming detail — this skill is the data/authz recipe.

## Pick the surface first

- **Café-admin** (`(cafe-admin)`): resource is tenant-owned (Category, Item, Membership, settings).
  Guard `requireCafeRole(cafeId, [...])`; data via `getTenantPrisma(cafeId)`; revalidate `menu:{cafeId}`
  when the change affects the public menu.
- **Platform** (`(platform)`): resource is cross-tenant (Cafe, Plan, User). Guard `requireSuperAdmin()`;
  data via base `prisma`; audit-log mutations.

## File layout (colocated)

```
app/(cafe-admin)/<resource>/
  page.tsx              # list (Server Component): guard → scoped read → <DataTable/> (shadcn Table/Card)
  actions.ts            # "use server": create/update/delete/reorder/toggle (typed-object args)
  schema.ts             # Zod schemas + z.infer types (shared by RHF form + actions)
  _components/Form.tsx  # "use client": RHF + zodResolver form rendered inside a <Sheet/> drawer
```

## 1) schema.ts — one schema, inferred types

```ts
import { z } from "zod";
export const ItemInput = z.object({
  cafeId: z.string(),
  categoryId: z.string(),
  nameFa: z.string().min(1),
  nameEn: z.string().optional(),
  calories: z.coerce.number().int().nonnegative().optional(),
  isAvailable: z.coerce.boolean().default(true),
});
export type ItemInput = z.infer<typeof ItemInput>;
```

## 2) actions.ts — validate → authorize → scoped write → revalidate

Actions take a **typed object** (validated client-side by RHF, re-validated here) and return a result
the form can map back to fields — never raw `FormData`, never a thrown Prisma error.

```ts
"use server";
import { ItemInput } from "./schema";
import { requireCafeRole } from "@/lib/auth";
import { getTenantPrisma } from "@/lib/tenant";
import { revalidateTag } from "next/cache";

type ActionResult = { ok: true } | { ok: false; error?: string; fieldErrors?: Record<string, string> };

export async function upsertItem(values: ItemInput): Promise<ActionResult> {
  const parsed = ItemInput.safeParse(values);                       // authoritative re-validation
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = i.message;
    return { ok: false, fieldErrors };
  }
  const input = parsed.data;
  const { cafeId } = await requireCafeRole(input.cafeId, ["OWNER","ADMIN","STAFF"]);  // authorize
  const db = getTenantPrisma(cafeId);
  await db.item.upsert({
    where: { id: input.id ?? "__new__" },
    create: { categoryId: input.categoryId, name: { fa: input.nameFa, en: input.nameEn }, calories: input.calories, isAvailable: input.isAvailable },
    update: { categoryId: input.categoryId, name: { fa: input.nameFa, en: input.nameEn }, calories: input.calories, isAvailable: input.isAvailable },
  });
  revalidateTag(`menu:${cafeId}`);                                  // refresh public menu
  return { ok: true };
}
```

Provide siblings as needed: `deleteItem`, `reorderItems` (batch `sortOrder`), `toggleAvailability`.
Each repeats the same four steps (validate → authorize → scoped write → revalidate) and returns
`ActionResult` — never throw raw errors to the client. The guard + `safeParse` here are the real
security boundary; RHF's client validation is UX only.

## 3) page.tsx — guarded list

```tsx
export default async function Page() {
  const { cafeId } = await requireCafeRole(activeCafeId, ["OWNER","ADMIN","STAFF"]);
  const db = getTenantPrisma(cafeId);
  const items = await db.item.findMany({ orderBy: { sortOrder: "asc" }, include: { images: { take: 1 } } });
  return <DataTable rows={items} /* create/edit open <Form/> */ />;
}
```

`activeCafeId` comes from the session/café-switcher, never the URL (café-admin). On the platform surface,
the id is a real route param but still re-checked by `requireSuperAdmin`.

## Shared primitives

Use `components/admin/DataTable` (shadcn `Table`, responsive → cards under `sm`) and the shared drawer
`ResourceForm`, both built on `components/ui/` (shadcn). The create/edit form renders **inside a `Sheet`**
and binds with **react-hook-form + zodResolver**; on success close the Sheet and toast (`sonner`). Map the
action's `fieldErrors` back via `form.setError`. Keep Persian content fields RTL; chrome can be LTR. See
the **`design-system`** skill for the Sheet/RHF/theming detail and the styling-rtl rule for invariants.

## Checklist (every admin resource)

- [ ] Correct surface, guard, and Prisma client (scoped vs base).
- [ ] Single Zod schema shared by RHF form + action; types via `z.infer`.
- [ ] Mutations: validate (`safeParse`) → authorize → scoped write → revalidate(`menu:{cafeId}` when public-facing); return `ActionResult`.
- [ ] Create/edit form opens in a `Sheet` drawer; RHF + zodResolver client-side; server re-validates.
- [ ] List/table is responsive (no overflow), scoped, ordered, and selective (no unbounded `findMany`).
- [ ] Platform mutations audit-logged.
