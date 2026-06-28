"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { THEME_NAMES, DEFAULT_THEME } from "@/lib/themes";

/**
 * Admin-only theme provider. Wraps ONLY the (cafe-admin) and (platform) layouts.
 * next-themes writes `data-theme` on <html>; the admin token overrides in globals.css
 * are scoped to `.admin-root` so the public menu (no provider, no wrapper) is untouched.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={THEME_NAMES}
      defaultTheme={DEFAULT_THEME}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
