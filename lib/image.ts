import "server-only";
import { createHmac } from "node:crypto";
import { decode } from "blurhash";
import sharp from "sharp";
import { env } from "@/lib/env";

/**
 * imgproxy signed-URL builder + blurhash helpers.
 *
 * Signed URLs require the secret key, which must stay server-side — so we build them in
 * RSC loaders and render server-signed `<img srcSet>` (NOT a client `next/image` loader,
 * which would leak the key into the browser bundle). imgproxy serves AVIF/WebP based on the
 * browser's Accept header (detection enabled in docker-compose).
 */
const KEY = Buffer.from(env.IMGPROXY_KEY, "hex");
const SALT = Buffer.from(env.IMGPROXY_SALT, "hex");
const BUCKET = env.MINIO_BUCKET;
const BASE = env.IMGPROXY_URL.replace(/\/$/, "");

/**
 * Signed imgproxy URL.
 * - mode "fill" (default): crop to fill `width`×`height` with smart gravity (item photos).
 * - mode "fit": resize to fit within `width`×`height` without cropping (logos / aspect-preserving).
 * `height` 0 keeps the aspect ratio.
 */
export function imgUrl(
  objectKey: string,
  width: number,
  height = 0,
  mode: "fill" | "fit" = "fill",
): string {
  const source = `s3://${BUCKET}/${objectKey}`;
  const encodedSource = Buffer.from(source).toString("base64url");
  const options = mode === "fit" ? `rs:fit:${width}:${height}:0` : `rs:fill:${width}:${height}:0/g:sm`;
  const path = `/${options}/${encodedSource}`;
  const signature = createHmac("sha256", KEY).update(SALT).update(path).digest("base64url");
  return `${BASE}/${signature}${path}`;
}

/** Build a `srcSet` string of signed URLs at the given widths. */
export function imgSrcSet(objectKey: string, widths: number[]): string {
  return widths.map((w) => `${imgUrl(objectKey, w)} ${w}w`).join(", ");
}

/** Decode a blurhash into a tiny PNG data URL for use as an LQIP placeholder. */
export async function blurhashToDataURL(hash: string, width = 32, height = 32): Promise<string> {
  const pixels = decode(hash, width, height); // Uint8ClampedArray, RGBA
  const png = await sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}
