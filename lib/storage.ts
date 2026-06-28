import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

/**
 * MinIO (S3-compatible) object storage. Uploads go browser→MinIO via a presigned PUT;
 * reads (for blurhash/probe) happen server-side. Bytes NEVER stream through Next.
 * Every key must live under the requesting café's prefix: `cafes/{cafeId}/…`.
 *
 * Two clients: `s3Public` signs presigned URLs with the PUBLIC endpoint (the host the browser hits),
 * while `s3Internal` performs server-side reads/writes over the in-cluster address — so server I/O
 * doesn't round-trip through the public proxy. In dev both endpoints are the same localhost URL.
 */
const credentials = {
  accessKeyId: env.MINIO_ACCESS_KEY,
  secretAccessKey: env.MINIO_SECRET_KEY,
};

// AWS SDK v3 (≥3.729) adds an automatic CRC32 integrity checksum to PutObject by default. For a
// PRESIGNED PUT that breaks uploads: the presigner signs `x-amz-checksum-crc32` for an empty body, but
// the browser sends the real bytes — MinIO then 403s on the checksum mismatch. `WHEN_REQUIRED` reverts
// to the pre-3.729 behaviour (no checksum unless the operation needs one), which MinIO expects.
const checksumOpts = {
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
} as const;

const s3Public = new S3Client({
  endpoint: env.MINIO_ENDPOINT,
  region: "us-east-1",
  forcePathStyle: true, // required for MinIO
  credentials,
  ...checksumOpts,
});

const s3Internal = new S3Client({
  endpoint: env.MINIO_INTERNAL_ENDPOINT ?? env.MINIO_ENDPOINT,
  region: "us-east-1",
  forcePathStyle: true,
  credentials,
  ...checksumOpts,
});

const BUCKET = env.MINIO_BUCKET;

/** Guard: a key must be scoped to the given café. Throws otherwise (defense in depth). */
export function assertCafeKey(cafeId: string, key: string): void {
  if (!key.startsWith(`cafes/${cafeId}/`)) {
    throw new Error("Object key is outside the café prefix.");
  }
}

/** Short-lived presigned PUT. The client must send the same Content-Type on upload. */
export async function presignPut(
  key: string,
  contentType: string,
  expiresInSeconds = 120,
): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(s3Public, cmd, { expiresIn: expiresInSeconds });
}

/**
 * Server-side upload of bytes we already hold in memory (e.g. seeding default menu photos).
 * NOT for user uploads — those go browser→MinIO via `presignPut`. Bytes never stream through Next.
 */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await s3Internal.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }),
  );
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await s3Internal.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  if (!res.Body) throw new Error(`Object not found: ${key}`);
  return Buffer.from(await res.Body.transformToByteArray());
}

export async function deleteObject(key: string): Promise<void> {
  await s3Internal.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
