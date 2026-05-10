import type { BookingStatus } from "./types";

export const bookingStatuses: Array<{
  value: BookingStatus;
  label: string;
  className: string;
}> = [
  { value: "reserved", label: "Бронь", className: "border-amber-200 bg-amber-100 text-amber-800" },
  { value: "paid", label: "Оплачено", className: "border-sage-200 bg-sage-100 text-sage-700" },
  { value: "living", label: "Проживает", className: "border-blue-200 bg-blue-100 text-blue-800" },
  { value: "checked_out", label: "Выехал", className: "border-zinc-200 bg-zinc-100 text-zinc-700" },
];

export const statusLabel = (status: BookingStatus) =>
  bookingStatuses.find((item) => item.value === status)?.label ?? status;

export const statusClassName = (status: BookingStatus) =>
  bookingStatuses.find((item) => item.value === status)?.className ?? "border-zinc-200 bg-zinc-100 text-zinc-700";

export const formatPrice = new Intl.NumberFormat("ru-RU").format;
