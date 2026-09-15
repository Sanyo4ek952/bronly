"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Dot } from "lucide-react";

import type { AgentCalendarBusyRange, AgentCalendarPropertyItem, AgentCalendarRoomItem } from "@/entities/collaboration";
import { cn } from "@/shared/lib/cn";
import { formatDateLabel } from "@/shared/lib/date";
import { AppIcon, Button, IconButton, Panel, StatCard } from "@/shared/ui";
import {
  addMonths,
  formatDateKey,
  formatMonthRangeLabel,
  formatShortDateLabel,
  getNearestBusyRange,
  getTimelineBusyRanges,
  getTimelineDays,
  getTimelineStartIndex,
  getVisibleTimelineDays,
  startOfMonth,
  useTimelineVisibleDayCount,
} from "@/entities/room/model/calendar-helpers";

function getRoomSummary(room: AgentCalendarRoomItem) {
  return room.busyRanges.length ? `${room.busyRanges.length} занятых диапазонов` : "Свободно";
}

function getRangeLabel(range: AgentCalendarBusyRange) {
  return range.label || "Занято";
}

function getDefaultTimelineAnchorKey(month: Date) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth();
  return isCurrentMonth ? formatDateKey(today) : formatDateKey(startOfMonth(month));
}

export function AgentCalendarBrowser({ properties }: { properties: AgentCalendarPropertyItem[] }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id ?? "");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [timelineAnchorKey, setTimelineAnchorKey] = useState(() => getDefaultTimelineAnchorKey(new Date()));
  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? properties[0] ?? null,
    [properties, selectedPropertyId],
  );
  const visibleDayCount = useTimelineVisibleDayCount();
  const timelineDays = useMemo(() => getTimelineDays(currentMonth), [currentMonth]);
  const timelineStartIndex = useMemo(
    () => getTimelineStartIndex(timelineDays, visibleDayCount, timelineAnchorKey),
    [timelineAnchorKey, timelineDays, visibleDayCount],
  );
  const visibleTimelineDays = useMemo(
    () => getVisibleTimelineDays(timelineDays, timelineStartIndex, visibleDayCount),
    [timelineDays, timelineStartIndex, visibleDayCount],
  );
  const nearestBusyRange = useMemo(
    () => getNearestBusyRange((selectedProperty?.rooms ?? []).flatMap((room) => room.busyRanges)),
    [selectedProperty],
  );
  const canMoveTimelineBackward = timelineStartIndex > 0;
  const canMoveTimelineForward = timelineStartIndex + visibleTimelineDays.length < timelineDays.length;
  const timelineWindowLabel = visibleTimelineDays.length
    ? `${formatShortDateLabel(visibleTimelineDays[0].key)} - ${formatShortDateLabel(visibleTimelineDays[visibleTimelineDays.length - 1].key)}`
    : formatMonthRangeLabel(currentMonth);

  function updateMonth(nextMonth: Date) {
    setCurrentMonth(nextMonth);
    setTimelineAnchorKey(getDefaultTimelineAnchorKey(nextMonth));
  }

  function shiftTimelineWindow(direction: -1 | 1) {
    const nextIndex = direction < 0
      ? Math.max(0, timelineStartIndex - visibleDayCount)
      : Math.min(Math.max(0, timelineDays.length - visibleDayCount), timelineStartIndex + visibleDayCount);
    const nextDay = timelineDays[nextIndex];
    if (nextDay) setTimelineAnchorKey(nextDay.key);
  }

  return (
    <Panel className="grid gap-0 overflow-hidden" surface="raised" padding="none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_243_236_/_0.82))] px-5 py-[18px] max-[720px]:px-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-[14px] bg-[rgb(var(--color-primary-rgb)_/_0.08)] text-[var(--accent-strong)]"><AppIcon icon={CalendarDays} className="size-5" /></span>
          <div><h2 className="text-[clamp(22px,4vw,28px)] font-bold leading-tight tracking-[-0.035em]">Календарь занятости</h2><p className="text-sm text-[var(--text-muted)]">{formatMonthRangeLabel(currentMonth)}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <IconButton aria-label="Предыдущий месяц" className="size-[42px]" onClick={() => updateMonth(addMonths(currentMonth, -1))}><AppIcon icon={ChevronLeft} /></IconButton>
          <Button variant="secondary" className="rounded-full" onClick={() => { const today = new Date(); updateMonth(new Date(today.getFullYear(), today.getMonth(), 1)); }}>Текущий месяц</Button>
          <IconButton aria-label="Следующий месяц" className="size-[42px]" onClick={() => updateMonth(addMonths(currentMonth, 1))}><AppIcon icon={ChevronRight} /></IconButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-[var(--border)] px-5 py-3 text-xs text-[var(--text-muted)] max-[720px]:px-4">
        <span className="inline-flex items-center gap-1"><Dot className="size-4 text-[#f2c94c]" />Свободно</span>
        <span className="inline-flex items-center gap-1"><Dot className="size-4 text-[#d99a2b]" />Занятые даты</span>
        <span className="inline-flex items-center gap-1"><Dot className="size-4 text-[var(--accent)]" />Сегодня</span>
        <span className="inline-flex items-center gap-1"><Dot className="size-4 text-[#3b6ea8]" />Только чтение</span>
      </div>

      <div className="grid gap-4 p-5 max-[720px]:p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard title="Подключенный вариант" value={selectedProperty?.title || "Нет варианта"} subtitle={selectedProperty?.subtitle || "Только чтение"} />
          <StatCard title="Номера" value={String(selectedProperty?.rooms.length ?? 0)} subtitle="Только активные сотрудничества" />
          <StatCard title="Ближайший период" value={nearestBusyRange ? `${formatShortDateLabel(nearestBusyRange.startsOn)} - ${formatShortDateLabel(nearestBusyRange.endsOn)}` : "Нет занятых дат"} subtitle={nearestBusyRange?.label || "Свободные даты"} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Подключенные варианты">
          {properties.map((property) => {
            const selected = property.id === selectedProperty?.id;
            return (
              <button key={property.id} type="button" role="tab" aria-selected={selected} className={cn("grid min-w-[180px] gap-1 rounded-[18px] border px-4 py-3 text-left transition", selected ? "border-[rgb(var(--color-primary-rgb)_/_0.30)] bg-[var(--color-primary-pale)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[rgb(var(--color-primary-rgb)_/_0.24)]")} onClick={() => setSelectedPropertyId(property.id)}>
                <strong className="truncate text-sm">{property.title}</strong><span className="text-xs text-[var(--text-muted)]">{property.rooms.length} номеров</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><strong className="text-sm">{timelineWindowLabel}</strong><p className="text-xs text-[var(--text-muted)]">{visibleTimelineDays.length} дней в видимом окне</p></div>
            <div className="flex gap-2">
              <IconButton aria-label="Показать предыдущие дни" className="size-10" disabled={!canMoveTimelineBackward} onClick={() => shiftTimelineWindow(-1)}><AppIcon icon={ChevronLeft} /></IconButton>
              <IconButton aria-label="Показать следующие дни" className="size-10" disabled={!canMoveTimelineForward} onClick={() => shiftTimelineWindow(1)}><AppIcon icon={ChevronRight} /></IconButton>
            </div>
          </div>

          <div className="max-h-[min(58vh,720px)] overflow-auto [scrollbar-gutter:stable_both-edges]">
            <div className="grid w-max min-w-[calc(190px+(var(--calendar-columns,31)*40px))] gap-2" style={{ ["--calendar-columns" as string]: String(visibleTimelineDays.length) }}>
              <div className="sticky top-0 z-[5] grid grid-cols-[190px_minmax(0,1fr)] gap-[14px] bg-[var(--surface)] pb-1.5">
                <div className="sticky left-0 z-[7] border-b border-[var(--border)] bg-[var(--surface)]" />
                <div className="grid" style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(38px, 40px))` }}>
                  {visibleTimelineDays.map((day) => <div key={day.key} className="grid min-h-[54px] justify-items-center gap-1 border-b border-[var(--border)] py-1.5 text-[11px] lowercase text-[var(--text-muted)]"><strong className={cn("text-xs text-[var(--text)]", day.isToday && "grid size-8 place-items-center rounded-xl border border-[rgb(var(--color-primary-rgb)_/_0.26)]")}>{day.dayLabel}</strong><span>{day.weekDayLabel}</span></div>)}
                </div>
              </div>

              <div className="grid gap-3">
                {(selectedProperty?.rooms ?? []).map((room, rowIndex) => {
                  const ranges = getTimelineBusyRanges(room.busyRanges, visibleTimelineDays);
                  return (
                    <div key={room.id} className="grid grid-cols-[190px_minmax(0,1fr)] gap-[14px]">
                      <div className="sticky left-0 z-[4] grid min-h-[72px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[20px] border border-[var(--border)] bg-[rgb(255_255_255_/_0.97)] px-4 py-3 shadow-[var(--shadow-sm)]">
                        <span className="grid size-9 place-items-center rounded-[14px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-sm font-bold text-[var(--color-primary-hover)]">{rowIndex + 1}</span>
                        <span className="grid min-w-0 gap-0.5"><strong className="truncate text-sm">{room.title}</strong><small className="text-xs text-[var(--text-muted)]">{room.subtitle || getRoomSummary(room)}</small></span>
                      </div>
                      <div className="grid gap-2 rounded-[20px] border border-[var(--border)] bg-[rgb(255_255_255_/_0.82)] p-3">
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(38px, 40px))` }}>
                          {visibleTimelineDays.map((day) => {
                            const busyRange = room.busyRanges.find((range) => day.key >= range.startsOn && day.key <= range.endsOn);
                            return <div key={`${room.id}-${day.key}`} className={cn("h-10 rounded-xl border border-transparent bg-[rgb(248_250_252_/_0.85)]", busyRange && "border-[rgb(217_154_43_/_0.18)] bg-[rgb(217_154_43_/_0.18)]", day.isToday && "border-[rgb(var(--color-primary-rgb)_/_0.22)]")} aria-label={`${room.title}: ${formatDateLabel(day.date)}. ${busyRange ? "Занято" : "Свободно"}.`} />;
                          })}
                        </div>
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(38px, 40px))` }}>
                          {ranges.map((range) => <div key={range.busyRange.id} className="grid gap-1 rounded-2xl border border-[#3b6ea8] bg-[#3b6ea8] px-2 py-2 text-left text-white shadow-[var(--shadow-sm)]" style={{ gridColumn: `${range.startIndex + 1} / span ${range.span}` }}><span className="truncate text-xs font-semibold">{range.clippedStart ? "…" : ""}{getRangeLabel(range.busyRange)}{range.clippedEnd ? "…" : ""}</span><span className="text-[11px] opacity-95">{formatShortDateLabel(range.busyRange.startsOn)} - {formatShortDateLabel(range.busyRange.endsOn)}</span></div>)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {selectedProperty?.rooms.length ? null : <p className="text-sm text-[var(--text-muted)]">У активного сотрудничества пока нет подключенных номеров для просмотра календаря занятости.</p>}
      </div>
    </Panel>
  );
}
