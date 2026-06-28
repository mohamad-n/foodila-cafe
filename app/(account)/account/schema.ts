import { z } from "zod";

/**
 * Self-service password change. The same object validates client-side (RHF, UX only) and
 * server-side (the Server Action stays authoritative). `currentPassword` is re-checked against
 * the stored hash in the action — never trusted from the client.
 */
export const ChangePasswordInput = z
  .object({
    currentPassword: z.string().min(1, "گذرواژهٔ فعلی را وارد کنید."),
    newPassword: z.string().min(8, "گذرواژهٔ جدید باید حداقل ۸ نویسه باشد."),
    confirmPassword: z.string().min(1, "تکرار گذرواژهٔ جدید را وارد کنید."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "تکرار گذرواژه با گذرواژهٔ جدید مطابقت ندارد.",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "گذرواژهٔ جدید باید با گذرواژهٔ فعلی متفاوت باشد.",
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>;
