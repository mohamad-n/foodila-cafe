# Claude Code config — Café Menu SaaS

Drop-in Claude Code configuration for the multi-tenant café-menu SaaS (Next.js + Prisma + MinIO,
Étude 3 public menu). Copy these into your repo root.

```
CLAUDE.md                     # main project guide; @-imports the rule files
.claude/
  rules/                      # binding rules, imported by CLAUDE.md
    00-core.md  security.md  typescript.md  data-fetching.md  redis.md  styling-rtl.md
  skills/                     # auto-consulted procedures
    tenant-isolation/SKILL.md # the cafeId isolation invariant + scoped Prisma client
    prisma-data-model/SKILL.md# canonical schema + migration workflow
    nextjs-conventions/SKILL.md# route groups, Server Actions, RSC/client, ISR
    auth-rbac/SKILL.md        # platform SUPER_ADMIN vs café OWNER/ADMIN/STAFF guards
    image-pipeline/SKILL.md   # MinIO presign → blurhash → imgproxy delivery
    admin-resource/SKILL.md   # repeatable CRUD scaffold for both admin surfaces
    menu-templates/           # public menu: 3 swappable templates + registry + shared core + theming
      SKILL.md
      assets/template-warm.html        # Étude 1 reference (pills + scroll feed + sheet)
      assets/template-scandi.html      # Étude 2 reference (tabs + grid + full page)
      assets/template-editorial.html   # Étude 3 reference (snap feed + takeover)
      assets/tokens.css                # shared primitives + per-template default tokens
```

## How it works

- **CLAUDE.md** is loaded into every Claude Code session in this repo. It states the stack, the three
  surfaces, the two RBAC tiers, and the cardinal rules, then `@`-imports the rule files.
- **rules/** are always-on constraints (security, TS, caching, styling/RTL).
- **skills/** are consulted on demand — when a task matches a skill's `description`, Claude reads that
  SKILL.md before acting. Descriptions are written "pushy" so they trigger reliably.

## Notes

- Rule imports use `@.claude/rules/*.md` (resolved from repo root). Keep this file tree at the root.
- These encode decisions agreed during planning. If a decision changes (e.g., ingredients become
  relational, or you add Redis/RLS), update the matching skill/rule so guidance stays truthful.
- Cursor mirror: ask and I'll generate equivalent `.cursor/rules/*.mdc` from the same content.
