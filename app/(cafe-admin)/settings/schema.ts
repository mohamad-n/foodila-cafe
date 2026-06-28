import { z } from "zod";

export const CafeIdInput = z.object({ cafeId: z.string().min(1) });

export const LogoInput = z.object({
  cafeId: z.string().min(1),
  objectKey: z.string().min(1),
});

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
