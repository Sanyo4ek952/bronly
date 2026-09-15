"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { formatDateLabel } from "@/shared/lib/date";
import { AppIcon, Button, IconButton } from "@/shared/ui";
import {
  addMonths,
  formatMonthLabel,
  formatMonthRangeLabel,
  getMonthDays,
  normalizeDateRange,
  parseDateKey,
  weekDays,
} from "@/entities/room/model/calendar-helpers";

type RoomDateRangeFieldProps = {
  label?: string;
  description?: string;
  startName?: string;
  endName?: string;
  defaultStartsOn?: string;
  defaultEndsOn?: string;
  className?: string;
};

function getInitialMonth(startsOn?: string, endsOn?: string) {
  const source = startsOn || endsOn;

  if (!source) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const date = parseDateKey(source);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getRangeLabel(startsOn: string, endsOn: string) {
  if (!startsOn || !endsOn) {
    return "Выбрать занятые даты";
  }

  return startsOn === endsOn ? formatDateLabel(startsOn) : `${formatDateLabel(startsOn)} - ${formatDateLabel(endsOn)}`;
}

export function RoomDateRangeField({
  label = "Занятые даты",
  description = "Выберите даты в одном календаре. Если диапазон не нужен, оставьте поле пустым.",
  startName = "startsOn",
  endName = "endsOn",
  defaultStartsOn = "",
  defaultEndsOn = "",
  className,
}: RoomDateRangeFieldProps) {
  const initialRange = defaultStartsOn && defaultEndsOn ? normalizeDateRange(defaultStartsOn, defaultEndsOn) : null;
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => getInitialMonth(defaultStartsOn, defaultEndsOn));
  const [selectionStart, setSelectionStart] = useState<string | null>(initialRange?.startsOn ?? null);
  const [range, setRange] = useState<{ startsOn: string; endsOn: string } | null>(initialRange);

  const monthDays = useMemo(() => getMonthDays(currentMonth, []), [currentMonth]);

  function handleDayClick(dayKey: string) {
    if (!selectionStart || range) {
      setSelectionStart(dayKey);
      setRange(null);
      return;
    }

    setRange(normalizeDateRange(selectionStart, dayKey));
    setSelectionStart(null);
  }

  function handleClear() {
    setSelectionStart(null);
    setRange(null);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <span className="text-[var(--label-size)] font-bold leading-[1.4] text-[var(--text-muted)]">{label}</span>
      <input type="hidden" name={startName} value={range?.startsOn ?? ""} />
      <input type="hidden" name={endName} value={range?.endsOn ?? ""} />

      <button
        type="button"
        className={cn(
          "grid min-h-[58px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-[14px] text-left text-[var(--color-text)] transition-[border-color,box-shadow,transform] duration-[180ms]",
          "hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.38)] hover:shadow-[0_12px_28px_rgb(15_23_42_/_0.08)]",
          isOpen && "border-[rgb(var(--color-primary-rgb)_/_0.38)] shadow-[0_12px_28px_rgb(15_23_42_/_0.08)]",
        )}
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
      >
        <span className="grid gap-1">
          <span className="text-sm font-bold leading-[1.35]">
            {range ? getRangeLabel(range.startsOn, range.endsOn) : "Выбрать занятые даты"}
          </span>
          <span className="text-xs leading-[1.5] text-[var(--color-muted)]">
            {range
              ? "Диапазон сохранится как занятые даты номера."
              : "Откройте календарь и выберите дату начала и дату окончания."}
          </span>
        </span>
        <span
          className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-[rgb(var(--color-primary-rgb)_/_0.08)] text-[var(--accent-strong)]"
          aria-hidden="true"
        >
          <AppIcon icon={CalendarDays} />
        </span>
      </button>

      {description ? <span className="text-xs leading-[1.45] text-[var(--text-muted)]">{description}</span> : null}

      {isOpen ? (
        <div className="grid gap-[14px] rounded-[20px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_252_/_0.92))] p-[18px] max-[640px]:rounded-[18px] max-[640px]:p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 max-[640px]:grid-cols-1">
            <div>
              <strong className="text-base font-semibold leading-[1.25] text-[var(--color-text)]">{formatMonthLabel(currentMonth)}</strong>
              <p className="text-[13px] leading-[1.5] text-[var(--color-muted)]">{formatMonthRangeLabel(currentMonth)}</p>
            </div>
            <div className="grid auto-cols-max grid-flow-col gap-2 max-[640px]:grid-flow-row">
              <IconButton
                aria-label="Предыдущий месяц"
                className="size-10"
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                <AppIcon icon={ChevronLeft} />
              </IconButton>
              <IconButton
                aria-label="Следующий месяц"
                className="size-10"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <AppIcon icon={ChevronRight} />
              </IconButton>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs text-[var(--color-muted)]">
            {weekDays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day) => {
              const isSelectedStart = selectionStart === day.key;
              const isActiveRange = Boolean(range && day.key >= range.startsOn && day.key <= range.endsOn);

              return (
                <button
                  key={day.key}
                  type="button"
                  className={cn(
                    "min-h-[42px] rounded-[14px] border border-transparent bg-[rgb(248_250_252_/_0.85)] text-sm font-semibold text-[var(--color-text)] transition-[transform,border-color,background-color] duration-[180ms]",
                    "hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)]",
                    !day.inCurrentMonth && "bg-[rgb(248_250_252_/_0.40)] text-[rgb(148_163_184)]",
                    day.isToday && "border-[rgb(var(--color-primary-rgb)_/_0.22)]",
                    (isSelectedStart || isActiveRange) && "border-[rgb(var(--color-primary-rgb)_/_0.32)] bg-[rgb(var(--color-primary-rgb)_/_0.14)] text-[rgb(var(--color-text-rgb))]",
                  )}
                  onClick={() => handleDayClick(day.key)}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 max-[640px]:grid-cols-1">
            <div className="text-[13px] leading-[1.5] text-[var(--color-muted)]">
              {range ? (
                <span>{getRangeLabel(range.startsOn, range.endsOn)}</span>
              ) : selectionStart ? (
                <span>Начало выбрано: {formatDateLabel(selectionStart)}</span>
              ) : (
                <span>Сначала выберите дату начала, затем дату окончания.</span>
              )}
            </div>
            <div className="grid auto-cols-max grid-flow-col gap-2 max-[640px]:grid-flow-row">
              <Button type="button" variant="ghost" className="gap-2" onClick={handleClear}>
                <AppIcon icon={X} />
                Очистить
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                Готово
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
