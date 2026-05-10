import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Введите имя"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
