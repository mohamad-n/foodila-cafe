import type { ZodError } from "zod";

/**
 * The contract every admin Server Action returns. The client form (RHF) maps
 * `fieldErrors` back onto fields and shows `error` as a toast. The Server Action
 * stays authoritative: it re-runs the guard + `Schema.parse` server-side and never
 * trusts client validation. (See the typescript rule + design-system skill.)
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };

/** Map a ZodError into `{ ok:false, fieldErrors }` (first message per field path). */
export function zodToActionResult(error: ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, error: "ورودی نامعتبر است.", fieldErrors };
}
