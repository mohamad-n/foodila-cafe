import type { Config } from "tailwindcss";

/**
 * RTL-aware Tailwind. Theme via CSS-variable tokens, never scattered magic numbers.
 * Use logical utilities (ps-/pe-/ms-/me-, start-/end-) in markup — never hard left/right.
 *
 * Two token namespaces (kept separate — see styling-rtl rule + design-system skill):
 *  1. shadcn semantic tokens (background/foreground/primary/…) — power every shadcn
 *     primitive on every surface; default (dark) set lives in `:root`, admin themes
 *     override them scoped to `.admin-root`.
 *  2. Public menu template tokens (--bg/--ink/--accent/…) — per-café via ThemeScope,
 *     consumed by menu.css only. Kept here as `bg/ink/hairline` legacy color aliases
 *     for the not-yet-migrated admin surfaces; retired during the DS overhaul.
 */
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Legacy menu/admin aliases (not the shadcn `accent` — that is semantic below).
        bg: "var(--color-bg)",
        ink: "var(--color-ink)",
        hairline: "var(--color-hairline)",
        // shadcn semantic tokens (HSL channel values in CSS vars).
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // Persian-primary: IRANYekan first; Poppins covers Latin glyphs after it.
        sans: [
          "var(--font-iranyekan)",
          "var(--font-poppins)",
          "Tahoma",
          "system-ui",
          "sans-serif",
        ],
        // Explicit handles when a surface should be one script only.
        latin: ["var(--font-poppins)", "system-ui", "sans-serif"],
        fa: ["var(--font-iranyekan)", "Tahoma", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
