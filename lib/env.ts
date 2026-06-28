import "server-only";
import { z } from "zod";

/**
 * Validated environment. Fail loud in dev, safe in prod: any missing/invalid config
 * throws at first import. Never read process.env directly elsewhere — import `env` from here.
 *
 * Storage / imgproxy / auth vars are intentionally optional in Phase 1 (scaffold) and become
 * required as the phases that use them land (Phase 3 auth, Phase 5 image pipeline).
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database (Phase 2)
  DATABASE_URL: z.string().url(),

  // Auth.js (Phase 3)
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),

  // Object storage — MinIO (Phase 5)
  // MINIO_ENDPOINT is the PUBLIC origin browsers use for presigned uploads (prod: https://s3.<domain>).
  // MINIO_INTERNAL_ENDPOINT (optional) is what the server uses for direct reads/writes — in prod the
  // in-cluster address (http://minio:9000) so server I/O never round-trips through nginx/TLS. Defaults
  // to MINIO_ENDPOINT (dev: they're the same localhost URL).
  MINIO_ENDPOINT: z.string().url(),
  MINIO_INTERNAL_ENDPOINT: z.string().url().optional(),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),

  // imgproxy (Phase 5) — hex-encoded key/salt
  IMGPROXY_URL: z.string().url(),
  IMGPROXY_KEY: z.string().regex(/^[0-9a-fA-F]+$/),
  IMGPROXY_SALT: z.string().regex(/^[0-9a-fA-F]+$/),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
