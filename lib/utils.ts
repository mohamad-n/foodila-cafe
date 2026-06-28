import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names. The single allowed way to combine conditional
 * classes across every surface (shadcn convention). clsx resolves conditionals,
 * tailwind-merge dedupes conflicting Tailwind utilities (last wins).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
