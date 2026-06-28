import "server-only";
import { db } from "@/lib/db";

/**
 * Tenant-scoped Prisma client. The ONLY sanctioned path to café-owned data.
 *
 * It auto-injects `cafeId` into every read/write of a tenant-owned model and constrains
 * updates/deletes by `cafeId`, so you can never read or mutate another tenant's rows — even
 * if a `where` is forgotten. The base client (lib/db.ts) is for non-tenant tables only.
 *
 * `cafeId` MUST come from the session/Membership (or a public slug→id lookup for the read-only
 * menu) — never from client-supplied form fields or query params. See .claude/skills/tenant-isolation.
 *
 * Keep this list in sync with the tenant-owned models in schema.prisma (PascalCase, as Prisma
 * reports `model` in $allOperations).
 */
const TENANT_MODELS = new Set<string>(["Membership", "Category", "Item", "ItemImage"]);

type MutableArgs = {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  create?: Record<string, unknown>;
};

const READ_OPS = new Set(["findFirst", "findFirstOrThrow", "findMany", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy"]);
const WHERE_WRITE_OPS = new Set(["update", "updateMany", "delete", "deleteMany"]);

export function getTenantPrisma(cafeId: string) {
  return db.$extends({
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_MODELS.has(model)) {
            return query(args);
          }
          const a = args as MutableArgs;

          if (READ_OPS.has(operation) || WHERE_WRITE_OPS.has(operation)) {
            a.where = { ...(a.where ?? {}), cafeId };
          }
          if (operation === "create") {
            a.data = { ...(a.data as Record<string, unknown>), cafeId };
          }
          if (operation === "createMany") {
            const rows = Array.isArray(a.data) ? a.data : a.data ? [a.data] : [];
            a.data = rows.map((r) => ({ ...r, cafeId }));
          }
          if (operation === "upsert") {
            a.where = { ...(a.where ?? {}), cafeId };
            a.create = { ...(a.create ?? {}), cafeId };
          }
          return query(args);
        },
      },
    },
  });
}

export type TenantPrisma = ReturnType<typeof getTenantPrisma>;
