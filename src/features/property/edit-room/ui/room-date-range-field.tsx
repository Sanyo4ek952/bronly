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
} from "@/widgets/calendar/lib/calendar-helpers";

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
    <div className={cn("br-form-field br-room-date-range", className)}>
      <span className="br-label">{label}</span>
      <input type="hidden" name={startName} value={range?.startsOn ?? ""} />
      <input type="hidden" name={endName} value={range?.endsOn ?? ""} />

      <button
        type="button"
        className={cn("br-room-date-range__trigger", isOpen && "br-room-date-range__trigger--open")}
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
      >
        <span className="br-room-date-range__trigger-copy">
          <span className="br-room-date-range__trigger-title">
            {range ? getRangeLabel(range.startsOn, range.endsOn) : "Выбрать занятые даты"}
          </span>
          <span className="br-room-date-range__trigger-meta">
            {range
              ? "Диапазон сохранится как занятые даты номера."
              : "Откройте календарь и выберите дату начала и дату окончания."}
          </span>
        </span>
        <span className="br-room-date-range__trigger-icon" aria-hidden="true">
          <AppIcon icon={CalendarDays} />
        </span>
      </button>

      {description ? <span className="br-form-help">{description}</span> : null}

      {isOpen ? (
        <div className="br-room-date-range__panel">
          <div className="br-room-date-range__header">
            <div>
              <strong>{formatMonthLabel(currentMonth)}</strong>
              <p>{formatMonthRangeLabel(currentMonth)}</p>
            </div>
            <div className="br-room-date-range__header-actions">
              <IconButton
                aria-label="Предыдущий месяц"
                className="br-room-date-range__nav"
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                <AppIcon icon={ChevronLeft} />
              </IconButton>
              <IconButton
                aria-label="Следующий месяц"
                className="br-room-date-range__nav"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <AppIcon icon={ChevronRight} />
              </IconButton>
            </div>
          </div>

          <div className="br-room-date-range__weekdays">
            {weekDays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="br-room-date-range__grid">
            {monthDays.map((day) => {
              const isSelectedStart = selectionStart === day.key;
              const isActiveRange = Boolean(range && day.key >= range.startsOn && day.key <= range.endsOn);

              return (
                <button
                  key={day.key}
                  type="button"
                  className={cn(
                    "br-room-date-range__day",
                    !day.inCurrentMonth && "br-room-date-range__day--outside",
                    day.isToday && "br-room-date-range__day--today",
                    isSelectedStart && "br-room-date-range__day--selected",
                    isActiveRange && "br-room-date-range__day--active",
                  )}
                  onClick={() => handleDayClick(day.key)}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="br-room-date-range__footer">
            <div className="br-room-date-range__summary">
              {range ? (
                <span>{getRangeLabel(range.startsOn, range.endsOn)}</span>
              ) : selectionStart ? (
                <span>Начало выбрано: {formatDateLabel(selectionStart)}</span>
              ) : (
                <span>Сначала выберите дату начала, затем дату окончания.</span>
              )}
            </div>
            <div className="br-room-date-range__actions">
              <Button type="button" variant="ghost" className="br-room-date-range__clear" onClick={handleClear}>
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
