"use client";

type BusyRangeLike = {
  id: string;
  startsOn: string;
  endsOn: string;
  label: string;
  note: string;
};

export type CalendarDayCell<TBusyRange extends BusyRangeLike> = {
  key: string;
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  busyRange: TBusyRange | null;
};

export type OverviewDayCell<TBusyRange extends BusyRangeLike> = {
  key: string;
  label: string;
  isToday: boolean;
  busyRange: TBusyRange | null;
};

export type TimelineDayCell = {
  key: string;
  date: Date;
  dayLabel: string;
  weekDayLabel: string;
  isToday: boolean;
};

export type TimelineRangeCell<TBusyRange extends BusyRangeLike> = {
  busyRange: TBusyRange;
  startIndex: number;
  endIndex: number;
  span: number;
  clippedStart: boolean;
  clippedEnd: boolean;
};

function getLocalDateParts(value: Date) {
  return {
    year: value.getFullYear(),
    month: String(value.getMonth() + 1).padStart(2, "0"),
    day: String(value.getDate()).padStart(2, "0"),
  };
}

export function formatDateKey(value: Date) {
  const { year, month, day } = getLocalDateParts(value);
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

export function endOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0);
}

export function addMonths(value: Date, amount: number) {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

export function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatMonthRangeLabel(value: Date) {
  const start = startOfMonth(value);
  const end = endOfMonth(value);

  return `${new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(start)} - ${new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end)}`;
}

export function formatShortDateLabel(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(parseDateKey(value));
}

export function normalizeDateRange(start: string, end: string) {
  return start <= end ? { startsOn: start, endsOn: end } : { startsOn: end, endsOn: start };
}

export function isDateWithinRange(date: string, startsOn: string, endsOn: string) {
  return date >= startsOn && date <= endsOn;
}

export function doesDateRangeOverlap(
  startsOn: string,
  endsOn: string,
  existingStartsOn: string,
  existingEndsOn: string,
) {
  return startsOn <= existingEndsOn && endsOn >= existingStartsOn;
}

export function findBusyRangeForDate<TBusyRange extends BusyRangeLike>(busyRanges: TBusyRange[], date: string) {
  return busyRanges.find((range) => isDateWithinRange(date, range.startsOn, range.endsOn)) ?? null;
}

export function hasBusyOverlap<TBusyRange extends BusyRangeLike>(
  busyRanges: TBusyRange[],
  startsOn: string,
  endsOn: string,
  excludedBusyRangeId?: string,
) {
  return busyRanges.some(
    (range) =>
      range.id !== excludedBusyRangeId &&
      doesDateRangeOverlap(startsOn, endsOn, range.startsOn, range.endsOn),
  );
}

export function getNearestBusyRange<TBusyRange extends BusyRangeLike>(busyRanges: TBusyRange[]) {
  const today = formatDateKey(new Date());
  const sortedRanges = [...busyRanges].sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  return sortedRanges.find((range) => range.endsOn >= today) ?? sortedRanges[0] ?? null;
}

export function getMonthDays<TBusyRange extends BusyRangeLike>(month: Date, busyRanges: TBusyRange[]) {
  const firstDay = startOfMonth(month);
  const firstWeekDay = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstWeekDay);
  const todayKey = formatDateKey(new Date());

  return Array.from({ length: 42 }, (_, index): CalendarDayCell<TBusyRange> => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    const currentKey = formatDateKey(current);

    return {
      key: currentKey,
      date: current,
      inCurrentMonth: current.getMonth() === month.getMonth(),
      isToday: currentKey === todayKey,
      busyRange: findBusyRangeForDate(busyRanges, currentKey),
    };
  });
}

export function getTimelineDays(month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = end.getDate();
  const todayKey = formatDateKey(new Date());

  return Array.from({ length: days }, (_, index): TimelineDayCell => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const currentKey = formatDateKey(current);

    return {
      key: currentKey,
      date: current,
      dayLabel: String(current.getDate()),
      weekDayLabel: shortWeekDays[(current.getDay() + 6) % 7],
      isToday: currentKey === todayKey,
    };
  });
}

export function getTimelineBusyRanges<TBusyRange extends BusyRangeLike>(
  busyRanges: TBusyRange[],
  days: TimelineDayCell[],
) {
  if (!days.length) {
    return [] as Array<TimelineRangeCell<TBusyRange>>;
  }

  const startKey = days[0].key;
  const endKey = days[days.length - 1].key;

  return busyRanges
    .filter((range) => doesDateRangeOverlap(startKey, endKey, range.startsOn, range.endsOn))
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn))
    .map((range) => {
      const visibleStart = range.startsOn < startKey ? startKey : range.startsOn;
      const visibleEnd = range.endsOn > endKey ? endKey : range.endsOn;
      const startIndex = days.findIndex((day) => day.key === visibleStart);
      const endIndex = days.findIndex((day) => day.key === visibleEnd);

      return {
        busyRange: range,
        startIndex,
        endIndex,
        span: endIndex - startIndex + 1,
        clippedStart: range.startsOn < startKey,
        clippedEnd: range.endsOn > endKey,
      };
    })
    .filter((range) => range.startIndex >= 0 && range.endIndex >= range.startIndex);
}

export function getOverviewDays<TBusyRange extends BusyRangeLike>(
  busyRanges: TBusyRange[],
  startDate = new Date(),
  daysToShow = 31,
) {
  const start = parseDateKey(formatDateKey(startDate));
  const todayKey = formatDateKey(new Date());

  return Array.from({ length: daysToShow }, (_, index): OverviewDayCell<TBusyRange> => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const currentKey = formatDateKey(current);

    return {
      key: currentKey,
      label: new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: index === 0 ? "short" : undefined }).format(
        current,
      ),
      isToday: currentKey === todayKey,
      busyRange: findBusyRangeForDate(busyRanges, currentKey),
    };
  });
}

const shortWeekDays = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
