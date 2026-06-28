import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

/** Append a platform audit entry. Call from every super-admin mutation + impersonation start/stop. */
export async function writeAudit(entry: {
  actorId: string;
  action: string;
  cafeId?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      cafeId: entry.cafeId ?? null,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
