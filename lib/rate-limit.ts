import "server-only";

/**
 * Minimal in-memory fixed-window rate limiter. Single-instance only — good enough for MVP
 * to protect the presign/auth endpoints. When we scale to multiple instances, move this to
 * Redis (sliding window) per the redis rule. Returns true if the call is allowed.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
