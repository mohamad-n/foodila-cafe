---
name: menu-templates
description: >
  The customer-facing menu supports THREE swappable templates (Warm / Scandi / Editorial); each café
  picks one and it renders that layout with the café's tokens. This skill covers the template registry,
  the shared headless core, the MenuTemplateProps contract, ThemeScope theming, code-splitting, and how
  to add or edit a template — plus the bundled reference HTML for all three. ALWAYS consult it when
  building or editing ANY customer-menu UI: a template layout, the snap/grid/feed browse model, the
  image carousel, fullscreen viewer, item detail, per-café theming, or template selection. Trigger on:
  "public menu", "menu template", "Warm/Scandi/Editorial", "[cafeSlug] page", "carousel", "fullscreen",
  "theme/tokens", "switch layout", "add a template".
---

# Menu templates (multi-template public menu)

> **Built on shadcn/ui too** (see `design-system`). Templates compose shadcn primitives + `cn()` where
> they fit (e.g. `Sheet`/`Dialog` for the detail takeover and fullscreen viewer, `Button`, `Badge`) but
> **keep their bespoke layout + per-café `ThemeScope` tokens** — don't flatten the distinct looks into
> generic shadcn cards. The public menu is **not** under the admin theme system: its colors come from
> `ThemeScope` (`--bg/--ink/…`), never from `next-themes`/`data-theme`. A default shadcn token set in
> `:root` lets any shadcn primitive render here without an admin theme. Templates must be **responsive**:
> phone-first, but scale up on `md+` (cap width / widen grid) so tablet/desktop aren't stretched phones.

The public menu is **template-based**. Two independent axes — keep them separate:

1. **Template** = the *layout + browse-model* (a discrete React component). `Cafe.template` ∈
   `WARM | SCANDI | EDITORIAL`. These differ structurally, not just in color:
   - **WARM** (Étude 1) — sticky category pills + vertical scroll feed + bottom-sheet detail. Cozy, rounded.
   - **SCANDI** (Étude 2) — sticky tab bar + 2-col grid + full-page detail. White, airy, minimal.
   - **EDITORIAL** (Étude 3) — full-bleed vertical snap feed + takeover detail. Dark, cinematic. *(default)*
2. **Tokens** = palette/type/radius via CSS variables. Defaults per template live in `assets/tokens.css`;
   `Cafe.themeTokens` overrides specific vars at render time (`ThemeScope`).

## Bundled reference (read the one you're building)

- `assets/template-warm.html`, `assets/template-scandi.html`, `assets/template-editorial.html` — the
  complete working reference for each layout (RTL Persian, real interactions). Port the layout + the
  pointer-drag/snap carousel + fullscreen logic from the matching file; don't reinvent.
- `assets/tokens.css` — shared carousel/fullscreen primitives + the three default token sets keyed by
  `[data-template="…"]`.

## The contract (every template implements this)

```ts
// components/menu/types.ts
export type Localized = { fa: string; en?: string };
export interface MenuImage { objectKey: string; width: number; height: number; blurhash: string }
export interface MenuItem {
  id: string; name: Localized; description?: Localized;
  ingredients: string[]; calories?: number;
  price?: number;                  // whole تومان; omitted when the café hides price (Cafe.showPrice=false)
  isAvailable: boolean; images: MenuImage[];
}
export interface MenuCategory { id: string; name: Localized; items: MenuItem[] }
export interface MenuTemplateProps {
  cafe: {
    name: string; defaultLocale: string;
    logoSrc?: string | null;       // signed imgproxy URL for the café logo (Cafe.logoKey); null = none
  };
  categories: MenuCategory[];
}
```

A template is a client component `(props: MenuTemplateProps) => JSX`. It owns only its layout/browse
model; everything else comes from the shared core so the three never duplicate logic.

## Shared headless core (write once, all templates use)

```
components/menu/
  types.ts
  core/
    ImageCarousel.tsx      # swipeable track (dir="ltr"), dots, ⛶ → fullscreen
    FullscreenViewer.tsx   # swipe + dots + close, object-fit:contain
    ItemDetailContent.tsx  # name + calories + ingredients + <ImageCarousel/> (the detail body)
    ThemeScope.tsx         # wrapper: sets data-template + injects themeTokens CSS vars
    faNum.ts               # Persian digits; image loader helpers
  templates/
    Warm.tsx  Scandi.tsx  Editorial.tsx
  registry.ts
```

Each template wraps the **same** `ItemDetailContent` in its own shell (bottom sheet / full page /
takeover). Carousel + fullscreen are never re-implemented per template.

## Registry + render (code-split, static-friendly)

```ts
// components/menu/registry.ts
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { MenuTemplateProps } from "./types";
import type { MenuTemplate } from "@prisma/client";

export const TEMPLATES: Record<MenuTemplate, ComponentType<MenuTemplateProps>> = {
  WARM:      dynamic(() => import("./templates/Warm")),
  SCANDI:    dynamic(() => import("./templates/Scandi")),
  EDITORIAL: dynamic(() => import("./templates/Editorial")),
};
```

```tsx
// app/(public)/[cafeSlug]/page.tsx — RSC, static + ISR
const cafe = await getCafeBySlug(slug);          // base client, read-only public lookup
const db = getTenantPrisma(cafe.id);
const categories = await db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" },
  include: { items: { where: { /* show all; mark unavailable in UI */ }, orderBy: { sortOrder: "asc" }, include: { images: { orderBy: { sortOrder: "asc" } } } } } });
const Template = TEMPLATES[cafe.template];
return (
  <ThemeScope template={cafe.template} tokens={cafe.themeTokens}>
    <Template cafe={{ name: cafe.name, defaultLocale: cafe.defaultLocale }} categories={categories} />
  </ThemeScope>
);
```

Why this stays correct + fast:
- **Code-split per template** (`next/dynamic`): a café ships only its layout's JS — vital for the
  image-heavy menu on cellular. The other two never load.
- **Static/ISR unchanged**: `cafe.template` is known at render/revalidate time; admin changes call
  `revalidateTag("menu:"+cafeId)`. See `nextjs-conventions` + the data-fetching rule.
- **No token flash**: `ThemeScope` sets `data-template` + inline CSS vars server-side on the wrapper.
- **One image, many crops**: templates use different aspect ratios (16/11 card, square, full-bleed
  portrait). imgproxy resizes from the same stored object — no extra storage. See `image-pipeline`.

## Theming (`ThemeScope`)

Renders `<div data-template={template} style={cssVarsFrom(tokens)}>`. `tokens.css` supplies the
per-template defaults; `Cafe.themeTokens` overrides only the vars a café customizes (e.g. `--accent`).
Validate `themeTokens` against an allow-list of var names (no arbitrary CSS injection).

## Invariants for ALL templates

- RTL (`dir="rtl" lang="fa"`), logical CSS props only; **carousel track stays `dir="ltr"`**.
- Persian digits via `faNum()`; real `alt` per image; respect `prefers-reduced-motion`.
- Images through the imgproxy `next/image` loader + blurhash placeholder + correct `sizes`.
- Shared detail body = `ItemDetailContent`; only the shell differs per template.

## Adding / editing a template

1. Add the value to the `MenuTemplate` enum (see `prisma-data-model`) + migration.
2. Create `templates/<Name>.tsx` implementing `MenuTemplateProps`, composing core pieces; port layout
   from the matching `assets/template-*.html`.
3. Register it in `registry.ts`; add a `[data-template="<name>"]` token block in `tokens.css`.
4. Wire it into the admin template selector (see below). No other surface changes.

## Admin selection

Café admin sets `Cafe.template` in settings — a selector with a **live preview** via
`?previewTemplate=` (authed-admin only, uncached). Guard `requireCafeRole(cafeId, ["OWNER","ADMIN"])`,
then `revalidateTag("menu:"+cafeId)`. (Plan/tier gating of templates is deferred with pricing.)

## Definition of done

- [ ] New/edited template implements `MenuTemplateProps`, composes the shared core (no duplicated carousel/detail).
- [ ] Registered + token block added; code-split via `next/dynamic`.
- [ ] RTL correct, carousel track `dir="ltr"`, drag/snap + fullscreen working on touch, reduced-motion respected.
- [ ] Images via imgproxy loader + blurhash; Persian digits; page stays static/ISR.
- [ ] `themeTokens` validated against the var allow-list.
