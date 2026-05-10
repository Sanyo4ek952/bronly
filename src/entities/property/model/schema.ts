import { z } from "zod";

export const propertySchema = z.object({
  title: z.string().trim().min(2, "Введите название объекта"),
  description: z.string().trim().max(1000, "Описание слишком длинное"),
  city: z.string().trim().min(2, "Введите город"),
  district: z.string().trim().max(120, "Район слишком длинный"),
  address: z.string().trim().min(5, "Введите адрес"),
  price_per_day: z
    .number()
    .min(1, "Цена должна быть больше 0")
    .max(1_000_000, "Цена слишком большая"),
  max_guests: z
    .number()
    .int("Укажите целое число гостей")
    .min(1, "Минимум 1 гость")
    .max(100, "Слишком много гостей"),
  is_active: z.boolean(),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;
