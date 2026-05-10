import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export const dateInputFormat = "yyyy-MM-dd";

export function todayInputValue() {
  return format(new Date(), dateInputFormat);
}

export function formatRuDate(value: string) {
  return format(parseISO(value), "d MMMM yyyy", { locale: ru });
}
