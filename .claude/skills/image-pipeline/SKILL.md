---
name: image-pipeline
description: >
  The end-to-end image pipeline for menu photos: browser→MinIO presigned uploads, per-café key scoping,
  imgproxy-based responsive AVIF/WebP delivery, blurhash LQIP placeholders, and the next/image loader.
  ALWAYS consult this skill when implementing or changing image upload, storage, serving, optimization,
  or the Étude 3 photo rendering. Trigger on: "upload image/photo", "MinIO/S3", "presigned url",
  "imgproxy", "blurhash/placeholder", "next/image loader", "responsive images", "item photos".
---

# Image pipeline

The public menu is full-bleed and photo-forward (Étude 3), opened on phones over cellular. Images must
be small, responsive, and never block. Bytes never pass through Next.

Flow: **browser → MinIO (presigned PUT) → persist metadata (Server Action) → serve via imgproxy**.

## 1. Upload (browser → MinIO directly)

- Server issues a short-lived presigned PUT scoped to a per-café key prefix. Never expose root creds.
  ```
  key: cafes/{cafeId}/items/{itemId}/{uuid}.{ext}
  ```
- Route Handler `app/api/presign/route.ts` (or a Server Action) — guarded by `requireCafeRole(cafeId,
  ["OWNER","ADMIN","STAFF"])` — returns `{ url, key }`. Constrain content-type and max size in the policy.
- Client PUTs the file straight to MinIO with the presigned URL (progress bar from the XHR/fetch).

## 2. Persist metadata (Server Action, after upload succeeds)

Compute dimensions + blurhash **server-side** from the stored object (don't trust the client), then write
the `ItemImage` row via the scoped client:

```ts
"use server";
import sharp from "sharp";
import { encode } from "blurhash";
import { getObjectBuffer } from "@/lib/storage";
import { getTenantPrisma } from "@/lib/tenant";
import { requireCafeRole } from "@/lib/auth";

export async function attachImage(cafeId: string, itemId: string, objectKey: string) {
  await requireCafeRole(cafeId, ["OWNER","ADMIN","STAFF"]);
  const buf = await getObjectBuffer(objectKey);
  const img = sharp(buf);
  const { width = 0, height = 0 } = await img.metadata();
  const { data, info } = await img.raw().ensureAlpha().resize(32, 32, { fit: "inside" }).toBuffer({ resolveWithObjectInfo: true });
  const blurhash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
  const db = getTenantPrisma(cafeId);
  await db.itemImage.create({ data: { itemId, objectKey, width, height, blurhash } });
  revalidateTag(`menu:${cafeId}`);
}
```

> Heavy work (blurhash/probe) is fine inline in the action for single small uploads. For bulky or bulk
> uploads, enqueue a **BullMQ job (Redis)**: the action enqueues `q:image:{cafeId}`, a worker in
> `workers/` probes dimensions + blurhash, writes the `ItemImage` via the scoped client, and revalidates
> `menu:{cafeId}`. See the redis rule. Don't queue prematurely — inline until it actually hurts.

## 3. Serve (imgproxy + next/image)

- All public reads go through **imgproxy** (separate container) which signs URLs and outputs AVIF/WebP at
  requested width. Build URLs in `lib/image.ts`:
  ```ts
  export function imgUrl(objectKey: string, w: number) {
    // imgproxy signed URL: resize:fill, gravity:sm, width=w, format=auto
    return buildSignedImgproxyUrl({ source: `s3://${BUCKET}/${objectKey}`, width: w, format: "auto" });
  }
  ```
- Wire a custom `next/image` loader to `imgUrl`. For the Étude 3 snap feed (≈ full viewport), set
  `sizes="100vw"` and `fill`; for the detail carousel set realistic `sizes`. Use the stored `blurhash`
  as the `placeholder="blur"` (convert blurhash → tiny dataURL, or render a blurhash canvas under the img).
- Always provide `alt` (item name). Respect `prefers-reduced-motion` for any fade-in.

## Storage helpers (`lib/storage.ts`)

- One MinIO client (S3 SDK), bucket from validated env. Functions: `presignPut(key, contentType)`,
  `getObjectBuffer(key)`, `deleteObject(key)`. All keys must start with `cafes/{cafeId}/`.
- On `ItemImage` delete, delete the MinIO object too (or sweep orphans in a periodic job).

## Don'ts

- ❌ Streaming uploads/downloads through Next API routes.
- ❌ Client-reported dimensions/blurhash as source of truth.
- ❌ Public bucket with predictable unsigned URLs — serve via signed imgproxy.
- ❌ Keys outside the requesting café's prefix.

## Checklist

- [ ] Presign guarded + scoped to `cafes/{cafeId}/…`.
- [ ] Dimensions + blurhash computed server-side.
- [ ] `ItemImage` written via scoped client; `menu:{cafeId}` revalidated.
- [ ] Rendering uses imgproxy loader + `sizes` + blurhash placeholder + `alt`.
