/**
 * Admin-only theme registry (extensible).
 *
 * Adding a theme is a two-step change, nothing else:
 *   1) add one entry here, and
 *   2) add one `html[data-theme="<id>"] .admin-root { … }` token block in app/globals.css.
 *
 * Themes apply ONLY to the admin surfaces ((cafe-admin) + (platform)), scoped to the
 * `.admin-root` wrapper. The public menu is themed per-café by ThemeScope and must never
 * be affected by an operator's chosen admin theme. Default theme is dark.
 */
export const THEMES = [
  { id: "dark", label: "تیره" },
  { id: "light", label: "روشن" },
  { id: "sepia", label: "سپیا" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const THEME_NAMES: ThemeId[] = THEMES.map((t) => t.id);

export const DEFAULT_THEME: ThemeId = "dark";
