import type { CSSProperties } from "react";
import type { MenuTemplate } from "@/lib/generated/prisma/client";

/**
 * Wraps a template: sets `data-template` (so tokens.css defaults apply) and injects per-café
 * `themeTokens` as CSS variables. Tokens are validated against an allow-list of var names + safe
 * values — never inject arbitrary CSS. Server component (no token flash).
 */
const ALLOWED_VARS = new Set(["bg", "ink", "soft", "accent", "accent-2", "panel", "line", "radius"]);
const SAFE_VALUE = /^#[0-9a-fA-F]{3,8}$|^rgba?\([0-9.,%\s]+\)$|^[0-9]{1,3}px$|^[0-9.]+rem$/;

function cssVarsFrom(tokens: unknown): CSSProperties {
  const style: Record<string, string> = {};
  if (tokens && typeof tokens === "object") {
    for (const [key, value] of Object.entries(tokens as Record<string, unknown>)) {
      if (ALLOWED_VARS.has(key) && typeof value === "string" && SAFE_VALUE.test(value)) {
        style[`--${key}`] = value;
      }
    }
  }
  return style as CSSProperties;
}

export function ThemeScope({
  template,
  tokens,
  children,
}: {
  template: MenuTemplate;
  tokens: unknown;
  children: React.ReactNode;
}) {
  return (
    <div className="menu-root" data-template={template.toLowerCase()} style={cssVarsFrom(tokens)}>
      {children}
    </div>
  );
}
