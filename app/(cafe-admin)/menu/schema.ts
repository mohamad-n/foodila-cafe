import { z } from "zod";

/**
 * Inputs use plain types (no preprocess/coerce) so `z.input === z.output` — required for
 * react-hook-form + zodResolver typing. Actions now receive typed objects straight from the
 * client form (not raw FormData), so no string-coercion at the boundary is needed; the same
 * Zod object re-validates server-side and stays authoritative. Empty optional strings ("")
 * are treated as "absent" in the actions.
 */
const optionalString = z.string().optional();

export const CategoryInput = z.object({
  cafeId: z.string().min(1),
  id: z.string().optional(),
  nameFa: z.string().min(1, "نام فارسی لازم است."),
  nameEn: optionalString,
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});
export type CategoryInput = z.infer<typeof CategoryInput>;

export const ItemInput = z.object({
  cafeId: z.string().min(1),
  id: z.string().optional(),
  categoryId: z.string().min(1, "دسته را انتخاب کنید."),
  nameFa: z.string().min(1, "نام فارسی لازم است."),
  nameEn: optionalString,
  descriptionFa: optionalString,
  descriptionEn: optionalString,
  ingredients: optionalString, // newline/comma separated → string[] in the action
  calories: z.number().int().nonnegative().optional(),
  price: z.number().int().nonnegative().optional(), // whole تومان
  sortOrder: z.number().int().min(0),
  isAvailable: z.boolean(),
});
export type ItemInput = z.infer<typeof ItemInput>;

export const IdInput = z.object({
  cafeId: z.string().min(1),
  id: z.string().min(1),
});

export const ToggleInput = z.object({
  cafeId: z.string().min(1),
  id: z.string().min(1),
  isAvailable: z.boolean(),
});

export const ImageAttachInput = z.object({
  cafeId: z.string().min(1),
  itemId: z.string().min(1),
  objectKey: z.string().min(1),
});
export type ImageAttachInput = z.infer<typeof ImageAttachInput>;

// ---- Serializable DTOs passed from RSC loaders to client forms ----
export type Localized = { fa: string; en?: string };

export type MenuImageDTO = {
  id: string;
  thumbUrl: string; // server-signed imgproxy URL
  blurhash: string;
};

export type MenuItemDTO = {
  id: string;
  categoryId: string;
  name: Localized;
  description: Localized | null;
  ingredients: string[];
  calories: number | null;
  price: number | null;
  isAvailable: boolean;
  sortOrder: number;
  images: MenuImageDTO[];
};

export type MenuCategoryDTO = {
  id: string;
  name: Localized;
  sortOrder: number;
  isActive: boolean;
  items: MenuItemDTO[];
};

export type CategoryOption = { id: string; name: Localized };
