---
name: design-system
description: >
  The shared UI foundation: shadcn/ui (Radix primitives + CVA + the cn() util + components.json) used
  across ALL surfaces, fully responsive (mobile/tablet/desktop), RTL-correct. Covers the token system,
  the admin-only extensible theme system (light/dark/sepia/…), the slide-out Sheet drawer pattern for
  admin entry forms, and react-hook-form + zodResolver wired to Server Actions. ALWAYS consult this
  skill when adding/editing any UI primitive, form, drawer, layout shell, breakpoint behavior, or theme.
  Trigger on: "shadcn", "ui component", "button/input/dialog/sheet", "drawer", "form", "responsive",
  "theme", "dark/light/sepia", "tokens", "cn()".
---

# Design system (shadcn/ui, everywhere)

shadcn/ui is the single component foundation for **every** surface — public menu, café-admin, and
platform-admin. Components are copied into `components/ui/` (we own the source), styled with Tailwind +
CSS-variable tokens, and composed with `cn()`. Don't hand-roll primitives that shadcn already provides.

> Stays on **Tailwind 3.4** (shadcn supports it — no v4 migration). pnpm only; Node 24 (`nvm use`).

## Setup (one-time, Phase 8)

- `pnpm dlx shadcn@latest init` → writes `components.json`, `lib/utils.ts` (`cn()`), Tailwind token
  wiring. Deps: `class-variance-authority clsx tailwind-merge tailwindcss-animate lucide-react`
  (+ Radix packages per component pulled by `shadcn add`).
- Form + theming deps: `react-hook-form @hookform/resolvers next-themes` (zod already present).
- Add components as needed: `pnpm dlx shadcn@latest add button input label textarea select checkbox
  switch card sheet dialog alert-dialog dropdown-menu table form sonner badge separator skeleton`.
- `cn()` (clsx + tailwind-merge) is the ONLY way to merge class names — never string-concat conditional
  classes.

## Token system (two namespaces — keep separate)

1. **shadcn semantic tokens** — `--background --foreground --card --popover --primary --secondary
   --muted --accent --destructive --border --input --ring --radius`. Power every shadcn component on
   every surface. A **default set lives in `:root`** so primitives render anywhere (incl. public).
2. **Public menu template tokens** — `--bg --ink --soft --accent --panel --line --radius` (see
   `menu-templates` + styling-rtl). These drive the bespoke Warm/Scandi/Editorial layouts and are set
   per-café by `ThemeScope`. **Independent of the admin theme system** below.

Never read raw hexes in markup — always go through Tailwind classes mapped to these vars
(`bg-background text-foreground border-border` …). Public templates keep using their `--bg/--ink` vars.

## Admin-only theme system (light / dark / sepia, extensible)

Themes switch **only the admin surfaces**. The public menu is themed per-café by `ThemeScope` and must
never be affected by an operator's chosen admin theme.

- **Provider:** `next-themes` (`attribute="data-theme"`, `themes={THEME_NAMES}`, `defaultTheme="dark"`,
  `enableSystem={false}`), wrapping **only** `(cafe-admin)` and `(platform)` layouts — not the public
  layout. It injects a no-flash script and persists the choice.
- **Admin-scoping:** the admin layouts render a wrapper `<div className="admin-root">`. Theme override
  blocks are scoped to it so they can't leak to public:
  ```css
  :root { /* default (dark) shadcn tokens — used everywhere, incl. public primitives */ }
  html[data-theme="light"] .admin-root { --background: …; --foreground: …; /* full set */ }
  html[data-theme="sepia"] .admin-root { --background: …; /* full set */ }
  html[data-theme="dark"]  .admin-root { /* explicit, = the dark set */ }
  ```
- **Registry (extensible):** `lib/themes.ts` exports `export const THEMES = [{ id:"dark", label:"تیره" },
  { id:"light", label:"روشن" }, { id:"sepia", label:"سپیا" }] as const;` and
  `export const THEME_NAMES = THEMES.map(t => t.id)`. **Adding a theme = one entry here + one
  `html[data-theme="<id>"] .admin-root {…}` token block.** Nothing else changes.
- **Switcher:** a client `ThemeSwitcher` (shadcn `DropdownMenu`) using `useTheme()`, iterating `THEMES`.
  Place it in the admin header. Guard against hydration mismatch (render after mount).

## Slide-out drawer for admin entry forms (Sheet, all sizes)

Every café-admin / platform-admin **create/edit form opens in a shadcn `Sheet`** (side drawer) — never
inline on the page. Same component on mobile, tablet, and desktop (no Vaul/bottom-drawer).

- Trigger: a "افزودن/ویرایش" button opens the Sheet; the form lives in `SheetContent`.
- **RTL side:** open from the inline-end edge — under `dir="rtl"` that is `side="left"`. Verify visually.
- **Width:** responsive — `className="w-full sm:max-w-md"` (full-screen on phones, panel on ≥sm).
- Destructive actions use `AlertDialog` (confirm), not a bare button.
- On success: close the Sheet, toast via `sonner`, let the Server Action's `revalidateTag` refresh data.

## Forms: react-hook-form + zodResolver → Server Action

Client validation is **UX only**. The **Server Action remains the authoritative guard + validator**
(`requireCafeRole`/`requireSuperAdmin` then `Schema.parse`) — never trust the client. Reuse the **same
Zod schema** (`schema.ts`) on both sides via `z.infer`.

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ItemInput } from "../schema";          // shared Zod schema
import { upsertItem } from "../actions";          // Server Action

export function ItemForm({ defaults, onDone }: { defaults?: ItemInput; onDone: () => void }) {
  const form = useForm<ItemInput>({ resolver: zodResolver(ItemInput), defaultValues: defaults });
  async function onSubmit(values: ItemInput) {
    const res = await upsertItem(values);                 // action re-validates + authorizes
    if (!res.ok) {                                         // map server errors back into RHF
      for (const [field, message] of Object.entries(res.fieldErrors ?? {})) {
        form.setError(field as keyof ItemInput, { message });
      }
      return;
    }
    onDone();                                             // close Sheet; toast handled by caller
  }
  return <Form {...form}>{/* FormField rows; submit calls form.handleSubmit(onSubmit) */}</Form>;
}
```

Actions accept a **typed object** (not raw `FormData`) and return
`{ ok: true } | { ok: false; error?: string; fieldErrors?: Record<string,string> }` — never throw raw
Prisma/stack errors to the client. (This refines the older `useActionState`/`FormData` pattern; see the
typescript rule + admin-resource skill.)

## Responsive (mobile / tablet / desktop)

- **Mobile-first.** Base styles target phones; layer `sm: md: lg: xl:` upward. Default breakpoints:
  `sm 640 · md 768 (tablet) · lg 1024 (desktop) · xl 1280`.
- **Admin shell:** header collapses to a `Sheet` nav under `md`; café switcher + theme switcher remain
  reachable. Data tables scroll horizontally or stack into cards under `sm` (don't let tables overflow).
- **Public menu:** already phone-first (QR). Ensure it scales up — cap content width and/or widen the
  grid on `md+` so tablet/desktop don't show a stretched phone layout.
- Touch targets ≥ 40px; respect `prefers-reduced-motion` (Radix animations + carousels).

## RTL

Document is `dir="rtl" lang="fa"`. Radix supports RTL but sides are physical — choose `side`/`align`
logically and verify (Sheet from inline-end = `left`; dropdowns `align="end"`). Use logical Tailwind
utilities (`ps-/pe-/ms-/me-`, `start-/end-`) — never hard `left/right` in layout. The menu carousel
**track stays `dir="ltr"`** (see menu-templates).

## Definition of done (any UI work)

- [ ] Built from `components/ui/` (shadcn) + `cn()`; no hand-rolled duplicate primitives.
- [ ] Responsive at mobile/tablet/desktop; tables don't overflow; touch targets adequate.
- [ ] RTL correct (logical props, Sheet/dropdown sides verified).
- [ ] Admin forms open in a `Sheet`; RHF + zodResolver client-side; **Server Action still authorizes +
      Zod-parses** and returns `{ ok, fieldErrors? }`.
- [ ] Admin theme tokens come from the registry; a new theme = registry entry + one token block.
- [ ] Public menu unaffected by the admin theme; its per-café `ThemeScope` tokens intact.
- [ ] `pnpm lint && pnpm typecheck` pass (+ `pnpm build` for layout/route changes).
