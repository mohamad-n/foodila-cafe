import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { env } from "@/lib/env";

/**
 * Base PrismaClient singleton (Prisma 7, @prisma/adapter-pg driver adapter).
 * Do NOT use this directly for tenant-owned data — use the tenant-scoped client from
 * `lib/tenant.ts` so every café query is constrained by `cafeId`. This base client is
 * for non-tenant tables (User, Cafe, Plan) and platform/super-admin operations only.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
