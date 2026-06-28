import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { MenuTemplate } from "@/lib/generated/prisma/client";
import type { MenuTemplateProps } from "./types";

/**
 * Template registry. Code-split per template (next/dynamic) so a café ships only its layout's JS —
 * the other two never load. SSR stays on so the menu is statically rendered + indexable.
 */
export const TEMPLATES: Record<MenuTemplate, ComponentType<MenuTemplateProps>> = {
  WARM: dynamic(() => import("./templates/Warm")),
  SCANDI: dynamic(() => import("./templates/Scandi")),
  EDITORIAL: dynamic(() => import("./templates/Editorial")),
};
