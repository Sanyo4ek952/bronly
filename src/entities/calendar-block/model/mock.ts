import type { CalendarBlock } from "@/entities/calendar-block/model/types";

export const calendarBlocks: CalendarBlock[] = Array.from({ length: 35 }, (_, index) => {
  const day = index + 1;

  if ([10, 11, 12].includes(day)) {
    return { day, type: "busy", label: "Июнь П." };
  }

  if ([18, 20].includes(day)) {
    return { day, type: "request", label: "Заявка" };
  }

  if ([24, 25].includes(day)) {
    return { day, type: "blocked", label: "Недоступно" };
  }

  return { day, type: "free" };
});
