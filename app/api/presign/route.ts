import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireCafeRole, AuthorizationError } from "@/lib/auth";
import { presignPut } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

// Issues a short-lived presigned PUT under the café's key prefix. Guarded by café membership;
// the client uploads bytes straight to MinIO (never through Next).
//  - kind "item"  → cafes/{cafeId}/items/{itemId}/…   (any café role)
//  - kind "logo"  → cafes/{cafeId}/branding/…          (OWNER/ADMIN only, branding)
const Body = z
  .object({
    cafeId: z.string().min(1),
    kind: z.enum(["item", "logo"]).default("item"),
    itemId: z.string().optional(),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  })
  .refine((b) => b.kind !== "item" || (b.itemId && b.itemId.length > 0), {
    message: "itemId is required for item uploads",
    path: ["itemId"],
  });

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`presign:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Branding (logo) is OWNER/ADMIN only; item images allow STAFF too.
  const roles =
    body.kind === "logo" ? (["OWNER", "ADMIN"] as const) : (["OWNER", "ADMIN", "STAFF"] as const);
  try {
    await requireCafeRole(body.cafeId, [...roles]);
  } catch (e) {
    const status = e instanceof AuthorizationError && e.kind === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const ext = EXT[body.contentType];
  const key =
    body.kind === "logo"
      ? `cafes/${body.cafeId}/branding/${randomUUID()}.${ext}`
      : `cafes/${body.cafeId}/items/${body.itemId}/${randomUUID()}.${ext}`;
  const url = await presignPut(key, body.contentType);
  return NextResponse.json({ url, key });
}
