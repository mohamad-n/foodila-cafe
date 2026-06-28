---
paths:
  - "app/**"
  - "components/**"
  - "**/*.css"
---

# Styling, RTL, design system & menu templates

UI is built on **shadcn/ui** across all surfaces (see the `design-system` skill). The public menu is
also **template-based** (Warm / Scandi / Editorial — see the `menu-templates` skill). These rules are
the **cross-cutting invariants**; component setup/theming detail lives in `design-system`,
template-specific layout in `menu-templates`. Don't hardcode one template's look into shared code.

- **Build on shadcn + `cn()`.** Use `components/ui/` primitives (owned shadcn sources) and merge classes
  only with `cn()` (clsx + tailwind-merge). Don't hand-roll buttons/inputs/dialogs that shadcn provides.
- **Responsive, mobile-first.** Base = phone; layer `sm/md/lg/xl` up (`md`=tablet, `lg`=desktop). Tables
  must not overflow (scroll or stack into cards under `sm`); touch targets ≥ 40px. Public menu is
  phone-first but must scale up gracefully (cap width / widen grid on `md+`).
- **Tokens, two namespaces (keep separate):** (1) **shadcn semantic tokens** `--background --foreground
  --card --primary --muted --accent --destructive --border --input --ring --radius` — default set in
  `:root`, power every shadcn component everywhere. (2) **menu template tokens** `--bg --ink --soft
  --accent --panel --line --radius` — per-café via `ThemeScope`, drive the bespoke templates only.
- **Admin-only theming.** Light/Dark/Sepia (extensible) switch **only** admin surfaces via `next-themes`
  (`data-theme` on `<html>`) with overrides scoped to the admin `.admin-root` wrapper. The public menu is
  themed per-café by `ThemeScope` and must **never** be affected by the admin theme. Registry in
  `lib/themes.ts`: a new theme = one entry + one `html[data-theme="<id>"] .admin-root {…}` block.
- **Admin entry forms open in a `Sheet`** (side drawer, all sizes — not inline). RTL: open from the
  inline-end edge (`side="left"` under `dir="rtl"`); responsive width `w-full sm:max-w-md`; destructive
  actions confirm via `AlertDialog`.
- **Direction:** document is `dir="rtl"`, `lang="fa"`. Use logical Tailwind utilities
  (`ps-/pe-/ms-/me-`, `start-/end-`) — never hard `left/right`. The image carousel **track** is forced
  `dir="ltr"` internally so swipe math stays correct; keep that pattern in every template.
- **Font:** self-hosted via `next/font/local` (`app/fonts/`) — **IRANYekan** for Persian, **Poppins**
  for Latin. The `font-sans` stack is Persian-primary: IRANYekan first, Poppins after it for Latin;
  fallback `Tahoma, system-ui`. Render numbers as Persian digits (۰۱۲۳…) in customer-facing UI via a
  shared `faNum()` helper.
- **Design tokens as CSS variables** (stable names): `--bg --ink --soft --accent --panel --line --radius`.
  Per-template defaults live in `menu-templates/assets/tokens.css` keyed by `[data-template]`;
  `Cafe.themeTokens` overrides specific vars via `ThemeScope`. Never read raw palette hexes in markup —
  always go through the variables, so a café's theme + chosen template both apply.
- **Shared core, not per-template copies:** carousel, fullscreen viewer, and the item-detail body are
  written once in `components/menu/core/` and composed by each template. Don't duplicate them.
- **Tailwind core utilities only**; theme via CSS variables, not arbitrary magic numbers in markup.
  Respect `prefers-reduced-motion` (disable snap/animations).
- **Accessibility:** real `alt` text per image, focusable controls, sufficient contrast over any scrim.
- Admin surfaces share `components/ui/` primitives but are utilitarian (clarity over drama) and may be LTR
  for Latin-heavy data while still supporting Persian content fields.
