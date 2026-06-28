# TypeScript & code style

- `strict: true`. **No `any`** — use `unknown` + narrowing, or proper types. No non-null `!` to silence errors.
- **Single source of truth for shapes:** infer from Prisma models and Zod schemas. Derive DTOs with
  `z.infer<typeof Schema>`; do not hand-maintain parallel interfaces.
- **Server/client boundary is explicit.** Server-only modules (db, auth, storage) must never be imported
  into client components. Use `import "server-only"` in those modules to enforce it.
- Name Server Action files `actions.ts`, colocated with the route segment that uses them.
- **Forms:** client-side use `react-hook-form` + `zodResolver` (the **same** `schema.ts` Zod object) for
  UX only. The **Server Action stays authoritative** — it re-runs the guard (`requireCafeRole` /
  `requireSuperAdmin`) and `Schema.parse` server-side; never trust client validation. Actions take a
  **typed object** (not raw `FormData`) and return `{ ok: true } | { ok: false; error?: string;
  fieldErrors?: Record<string, string> }`; the form maps `fieldErrors` back via `form.setError`.
- Prefer pure functions and early returns. Keep components small; extract logic into `lib/`.
- Errors: throw typed errors server-side; convert to user-safe messages in the action's return value.
  Never leak Prisma/stack details to the client.
- Async: no floating promises; handle or `await` everything. No data-fetching waterfalls (see data-fetching rule).
- Formatting/lint via ESLint + Prettier; CI fails on lint or type errors.
