import { z } from "zod";

export const bookingFormSchema = z
  .object({
    property_id: z.string().uuid("Выберите объект"),
    guest_name: z.string().trim().min(1, "Укажите имя гостя"),
    phone: z.string().trim().min(1, "Укажите телефон"),
    check_in: z.string().min(1, "Выберите дату заезда"),
    check_out: z.string().min(1, "Выберите дату выезда"),
    amount: z.string().refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: "Укажите корректную сумму брони",
    }),
    status: z.enum(["reserved", "paid", "living", "checked_out"]),
    comment: z.string(),
  })
  .refine((values) => new Date(values.check_out).getTime() > new Date(values.check_in).getTime(), {
    message: "Дата выезда должна быть позже даты заезда",
    path: ["check_out"],
  });
