import { z } from "zod";

export const CafeIdInput = z.object({ cafeId: z.string().min(1) });

export const LogoInput = z.object({
  cafeId: z.string().min(1),
  objectKey: z.string().min(1),
});

// Favicon shares the upload shape with the logo (a freshly-uploaded branding object).
export const FaviconInput = LogoInput;

// SEO / OpenGraph metadata for the public menu. Kept transform-free so `z.input === z.output`
// (required for react-hook-form + zodResolver typing); the action normalises empty → null.
export const MetaInput = z.object({
  cafeId: z.string().min(1),
  metaTitle: z.string().trim().max(120).optional(),
  metaDescription: z.string().trim().max(300).optional(),
});
export type MetaInput = z.infer<typeof MetaInput>;

export const DisplayInput = z.object({
  cafeId: z.string().min(1),
  showCalories: z.boolean(),
  showPrice: z.boolean(),
});
export type DisplayInput = z.infer<typeof DisplayInput>;

export const TemplateInput = z.object({
  cafeId: z.string().min(1),
  template: z.enum(["WARM", "SCANDI", "EDITORIAL"]),
});
export type TemplateInput = z.infer<typeof TemplateInput>;
