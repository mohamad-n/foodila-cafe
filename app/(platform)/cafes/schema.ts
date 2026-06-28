import { z } from "zod";

// Slugs share the root URL space with admin segments — keep these words reserved.
const RESERVED_SLUGS = new Set([
  "dashboard",
  "cafes",
  "login",
  "menu",
  "staff",
  "settings",
  "plans",
  "users",
  "api",
]);

const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, "اسلاگ فقط حروف کوچک انگلیسی، عدد و خط تیره.")
  .refine((s) => !RESERVED_SLUGS.has(s), "این اسلاگ رزرو شده است.");

const template = z.enum(["WARM", "SCANDI", "EDITORIAL"]);

export const CafeCreateInput = z.object({
  name: z.string().min(1, "نام لازم است."),
  slug,
  template,
  ownerEmail: z.string().email("ایمیل نامعتبر."),
  ownerPassword: z.string().min(8, "گذرواژه حداقل ۸ نویسه."),
});
export type CafeCreateInput = z.infer<typeof CafeCreateInput>;

export const CafeUpdateInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "نام لازم است."),
  slug,
  template,
  planId: z.string().optional(),
});
export type CafeUpdateInput = z.infer<typeof CafeUpdateInput>;

export const CafeStatusInput = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});
export type CafeStatusInput = z.infer<typeof CafeStatusInput>;

export const ImpersonateInput = z.object({ cafeId: z.string().min(1) });
