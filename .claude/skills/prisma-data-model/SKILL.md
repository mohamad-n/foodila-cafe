---
name: prisma-data-model
description: >
  The canonical Prisma data model for this café-menu SaaS plus how to evolve it safely. ALWAYS consult
  this skill before adding or changing any model, field, enum, relation, or index, and before running
  migrations. Use it when asked to "add a field/model", "change the schema", "write a migration",
  "store i18n / ingredients / allergens", or anything touching prisma/schema.prisma. It encodes the
  multi-tenant FK conventions and the migration workflow — don't improvise schema changes without it.
---

# Prisma data model

PostgreSQL, single shared schema, multi-tenant by `cafeId`. Keep the model lean; add tables only when a
feature needs them.

## Conventions

- IDs: `cuid()` string PKs. Timestamps: `createdAt @default(now())`, `updatedAt @updatedAt`.
- **Every tenant-owned model** has `cafeId String` + relation to `Cafe`, and an index that **starts with
  `cafeId`** (`@@index([cafeId, sortOrder])`, etc.). Order/listing fields: `sortOrder Int`.
- i18n text: store as JSONB `{ fa: string, en?: string }` (start fa-primary; adding locales = no migration).
  Type it in app code with a `Localized` Zod schema.
- Soft toggles, not hard deletes, for menu visibility: `isActive` / `isAvailable` booleans.
- Money (if/when ordering arrives): integer **minor units** + `currency`, never floats.
- **Menu look** is two fields on `Cafe`: `template` (discrete layout — `MenuTemplate`) and `themeTokens`
  (JSONB CSS-variable overrides). Don't conflate them — see the `menu-templates` skill.

## Canonical schema (sketch)

```prisma
enum PlatformRole { SUPER_ADMIN }          // absence = normal user
enum CafeRole     { OWNER ADMIN STAFF }
enum CafeStatus   { ACTIVE SUSPENDED }
enum MenuTemplate { WARM SCANDI EDITORIAL }   // public-menu layout/browse-model (see menu-templates skill)

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String?
  passwordHash String?
  platformRole PlatformRole?                 // set only for platform operators
  memberships  Membership[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Cafe {
  id          String      @id @default(cuid())
  slug        String      @unique             // used in (public)/[cafeSlug]
  name        String
  status      CafeStatus  @default(ACTIVE)
  defaultLocale String    @default("fa")
  template    MenuTemplate @default(EDITORIAL)  // which layout the café's menu renders
  themeTokens Json        @default("{}")       // per-café CSS-variable overrides (palette/type/radius)
  logoKey      String?                          // MinIO key cafes/{id}/branding/… ; null = no logo
  showCalories Boolean    @default(true)        // show item calories on the public menu
  showPrice    Boolean    @default(true)        // show item price on the public menu
  planId      String?
  plan        Plan?       @relation(fields: [planId], references: [id])
  memberships Membership[]
  categories  Category[]
  items       Item[]
  images      ItemImage[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Membership {
  id     String   @id @default(cuid())
  cafeId String
  cafe   Cafe     @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  userId String
  user   User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   CafeRole @default(STAFF)
  createdAt DateTime @default(now())
  @@unique([cafeId, userId])
  @@index([userId])
}

model Category {
  id        String  @id @default(cuid())
  cafeId    String
  cafe      Cafe    @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  name      Json                                // { fa, en? }
  subtitle  Json?                               // { fa, en? } optional tagline (e.g. «بر پایه قهوه»)
  sortOrder Int     @default(0)
  isActive  Boolean @default(true)
  items     Item[]
  @@index([cafeId, sortOrder])
}

model Item {
  id          String     @id @default(cuid())
  cafeId      String
  cafe        Cafe       @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  categoryId  String
  category    Category   @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name        Json                              // { fa, en? }
  description Json?                             // { fa, en? }
  ingredients Json       @default("[]")          // string[] (localized later if needed)
  calories    Int?
  price       Int?                              // whole تومان (no decimals); null = no price shown
  isAvailable Boolean    @default(true)
  sortOrder   Int        @default(0)
  images      ItemImage[]
  @@index([cafeId, categoryId, sortOrder])
}

model ItemImage {
  id        String  @id @default(cuid())
  cafeId    String
  cafe      Cafe    @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  itemId    String
  item      Item    @relation(fields: [itemId], references: [id], onDelete: Cascade)
  objectKey String                              // MinIO key: cafes/{cafeId}/items/{itemId}/{uuid}
  width     Int
  height    Int
  blurhash  String
  sortOrder Int     @default(0)
  @@index([cafeId, itemId, sortOrder])
}

model Plan {
  id    String @id @default(cuid())
  name  String
  // limits (cafes/items/images), price — fill when billing lands
  cafes Cafe[]
}
```

> `ingredients`/`allergens`: kept as JSON `string[]` for v1 simplicity. If allergen **filtering/badges**
> become a roadmap item, promote to `Ingredient`/`Allergen` tables (tenant-scoped) — note the tradeoff
> with the user before doing it.

## Migration workflow

1. Edit `prisma/schema.prisma`.
2. `pnpm prisma migrate dev -n <descriptive_name>` (dev) — review the generated SQL.
3. Confirm new tenant tables got `cafeId` + a `cafeId`-leading index; register the model name in the
   `TENANT_MODELS` list in `lib/tenant.ts` if it's tenant-owned.
4. Commit the migration with the schema change in the same commit.
5. CI/prod applies with `pnpm prisma migrate deploy` — **never** `db push` against shared DBs.

## Don'ts

- ❌ Adding a tenant table without `cafeId` or without updating `TENANT_MODELS`.
- ❌ `prisma db push` in CI/prod. ❌ Floats for money. ❌ Editing an already-applied migration file.
