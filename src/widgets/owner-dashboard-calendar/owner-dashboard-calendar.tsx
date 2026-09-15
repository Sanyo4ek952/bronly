"use client";

import { Building2, CalendarDays, ChevronLeft, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { OwnerCalendarInventoryGroup, OwnerCalendarInventoryRoom } from "@/entities/property";
import { cn } from "@/shared/lib/cn";
import { formatDateLabel } from "@/shared/lib/date";
import { AppIcon, Button, ButtonLink, IconButton, Panel, StatCard } from "@/shared/ui";
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

type OwnerDashboardCalendarProps = { groups: OwnerCalendarInventoryGroup[] };
type GroupFilterKind = "all" | "property" | "standalone";

function getDefaultTimelineAnchorKey(month: Date) {
  const today = new Date();
  return today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth()
    ? formatDateKey(today)
    : formatDateKey(startOfMonth(month));
}

function getRoomSummary(room: OwnerCalendarInventoryRoom) {
  if (!room.busyRanges.length) return room.subtitle || "Свободные даты";
  const ranges = `${room.busyRanges.length} занятых диапазонов`;
  return room.subtitle ? `${room.subtitle} · ${ranges}` : ranges;
}

const filterClass =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--text-muted)] transition-[border-color,background-color,color] duration-[180ms] hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)]";

export function OwnerDashboardCalendar({ groups }: OwnerDashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [groupFilter, setGroupFilter] = useState<GroupFilterKind>("all");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [timelineAnchorKey, setTimelineAnchorKey] = useState(() => getDefaultTimelineAnchorKey(new Date()));
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
  const groupsByKind = useMemo(
    () => groups.filter((group) => groupFilter === "all" || group.kind === groupFilter),
    [groupFilter, groups],
  );
  const visibleGroups = selectedGroupId === "all"
    ? groupsByKind
    : groupsByKind.filter((group) => group.id === selectedGroupId);
  const visibleRooms = visibleGroups.flatMap((group) => group.rooms);
  const nearestBusyRange = getNearestBusyRange(visibleRooms.flatMap((room) => room.busyRanges));
  const busyRoomsInView = visibleRooms.filter((room) =>
    room.busyRanges.some((range) => timelineDays.some((day) => day.key >= range.startsOn && day.key <= range.endsOn)),
  ).length;
  const canMoveBackward = timelineStartIndex > 0;
  const canMoveForward = timelineStartIndex + visibleTimelineDays.length < timelineDays.length;
  const windowLabel = visibleTimelineDays.length
    ? `${formatShortDateLabel(visibleTimelineDays[0].key)} — ${formatShortDateLabel(visibleTimelineDays[visibleTimelineDays.length - 1].key)}`
    : formatMonthRangeLabel(currentMonth);

  function updateMonth(nextMonth: Date) {
    setCurrentMonth(nextMonth);
    setTimelineAnchorKey(getDefaultTimelineAnchorKey(nextMonth));
  }

  function shiftWindow(direction: -1 | 1) {
    const nextIndex = direction < 0
      ? Math.max(0, timelineStartIndex - visibleDayCount)
      : Math.min(Math.max(0, timelineDays.length - visibleDayCount), timelineStartIndex + visibleDayCount);
    const nextDay = timelineDays[nextIndex];
    if (nextDay) setTimelineAnchorKey(nextDay.key);
  }

  return (
    <section className="grid gap-4">
      <Panel className="grid gap-5 overflow-hidden p-5 max-[640px]:p-4" surface="raised">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[14px] bg-[var(--color-primary-pale)] text-[var(--color-primary-hover)]"><AppIcon icon={CalendarDays} /></span>
            <div className="grid gap-1">
              <h2 className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.05] tracking-[-0.035em] text-[var(--text)]">Календарь кабинета</h2>
              <p className="text-sm text-[var(--text-muted)]">{formatMonthRangeLabel(currentMonth)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconButton aria-label="Предыдущий месяц" onClick={() => updateMonth(addMonths(currentMonth, -1))}><AppIcon icon={ChevronLeft} /></IconButton>
            <Button variant="secondary" className="rounded-full" onClick={() => updateMonth(startOfMonth(new Date()))}>Текущий месяц</Button>
            <IconButton aria-label="Следующий месяц" onClick={() => updateMonth(addMonths(currentMonth, 1))}><AppIcon icon={ChevronRight} /></IconButton>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <StatCard title="Номера в обзоре" value={String(visibleRooms.length)} subtitle="После выбранных фильтров" />
          <StatCard title="Заняты в месяце" value={String(busyRoomsInView)} subtitle="Есть занятые даты" />
          <StatCard title="Ближайший период" value={nearestBusyRange ? `${formatShortDateLabel(nearestBusyRange.startsOn)} — ${formatShortDateLabel(nearestBusyRange.endsOn)}` : "Нет занятых дат"} subtitle={nearestBusyRange?.label || "Свободные даты"} />
        </div>

        <div className="grid gap-3 border-t border-[var(--border)] pt-4">
          <div className="flex flex-wrap gap-2" aria-label="Тип размещения">
            {([['all', 'Все'], ['property', 'Объекты'], ['standalone', 'Отдельные номера']] as const).map(([kind, label]) => (
              <button key={kind} type="button" className={cn(filterClass, groupFilter === kind && "border-[var(--accent)] bg-[var(--color-primary-pale)] text-[var(--color-primary-hover)]")} aria-pressed={groupFilter === kind} onClick={() => { setGroupFilter(kind); setSelectedGroupId("all"); }}>{label}</button>
            ))}
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="Группа календаря">
            <button type="button" className={cn(filterClass, selectedGroupId === "all" && "border-[var(--accent)] bg-[var(--color-primary-pale)] text-[var(--color-primary-hover)]")} aria-pressed={selectedGroupId === "all"} onClick={() => setSelectedGroupId("all")}>Все группы</button>
            {groupsByKind.map((group) => (
              <button key={group.id} type="button" className={cn(filterClass, "whitespace-nowrap", selectedGroupId === group.id && "border-[var(--accent)] bg-[var(--color-primary-pale)] text-[var(--color-primary-hover)]")} aria-pressed={selectedGroupId === group.id} onClick={() => setSelectedGroupId(group.id)}>{group.title} · {group.rooms.length}</button>
            ))}
          </div>
        </div>
      </Panel>

      {visibleGroups.length ? visibleGroups.map((group) => (
        <Panel key={group.id} className="grid gap-4 overflow-hidden p-4 sm:p-5" surface="raised">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[var(--color-primary-pale)] text-[var(--color-primary-hover)]"><AppIcon icon={group.kind === "property" ? Building2 : Home} /></span>
              <div className="grid min-w-0 gap-1"><h3 className="text-lg font-semibold text-[var(--text)]">{group.title}</h3><p className="text-sm leading-[1.5] text-[var(--text-muted)]">{group.subtitle}</p></div>
            </div>
            {group.kind === "property" ? <div className="flex flex-wrap gap-2"><ButtonLink href={group.detailHref} variant="secondary" size="sm">Открыть объект</ButtonLink><ButtonLink href={group.calendarHref} size="sm">Редактировать даты</ButtonLink></div> : null}
          </div>

          {group.rooms.length ? (
            <div className="grid gap-3 border-t border-[var(--border)] pt-4">
              <div className="flex items-center justify-between gap-3"><div><strong className="text-sm text-[var(--text)]">{windowLabel}</strong><p className="text-xs text-[var(--text-muted)]">{visibleTimelineDays.length} дней в окне</p></div><div className="flex gap-2"><IconButton aria-label="Предыдущие дни" disabled={!canMoveBackward} onClick={() => shiftWindow(-1)}><AppIcon icon={ChevronLeft} /></IconButton><IconButton aria-label="Следующие дни" disabled={!canMoveForward} onClick={() => shiftWindow(1)}><AppIcon icon={ChevronRight} /></IconButton></div></div>
              <div className="overflow-x-auto pb-2">
                <div className="grid min-w-[760px] gap-3">
                  <div className="grid grid-cols-[190px_minmax(0,1fr)] gap-3">
                    <div />
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(38px, 1fr))` }}>{visibleTimelineDays.map((day) => <div key={day.key} className={cn("grid min-h-12 place-items-center rounded-xl bg-[var(--surface-subtle)] text-[11px] text-[var(--text-muted)]", day.isToday && "bg-[var(--color-primary-pale)] text-[var(--color-primary-hover)]")}><strong className="text-xs">{day.dayLabel}</strong><span>{day.weekDayLabel}</span></div>)}</div>
                  </div>
                  {group.rooms.map((room, rowIndex) => {
                    const ranges = getTimelineBusyRanges(room.busyRanges, visibleTimelineDays);
                    return (
                      <div key={room.id} className="grid grid-cols-[190px_minmax(0,1fr)] items-stretch gap-3">
                        <Link href={room.calendarHref} className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3 text-inherit hover:border-[rgb(var(--color-primary-rgb)_/_0.28)]">
                          <span className="grid size-8 place-items-center rounded-xl bg-[var(--color-primary-pale)] text-xs font-bold text-[var(--color-primary-hover)]">{rowIndex + 1}</span>
                          <span className="grid min-w-0 gap-1"><strong className="truncate text-sm">{room.title}</strong><small className="truncate text-[11px] text-[var(--text-muted)]">{getRoomSummary(room)}</small></span>
                        </Link>
                        <div className="grid gap-2 rounded-[18px] border border-[var(--border)] bg-[var(--surface-subtle)] p-2.5">
                          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(38px, 1fr))` }}>{visibleTimelineDays.map((day) => { const busy = room.busyRanges.find((range) => day.key >= range.startsOn && day.key <= range.endsOn); return <div key={`${room.id}-${day.key}`} className={cn("h-9 rounded-xl border border-transparent bg-white", busy && "border-[rgb(217_154_43_/_0.24)] bg-[rgb(217_154_43_/_0.18)]", day.isToday && "border-[var(--accent)]")} aria-label={`${room.title}: ${formatDateLabel(day.date)}. ${busy ? "Занято" : "Свободно"}.`} />; })}</div>
                          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(38px, 1fr))` }}>{ranges.map((range) => <Link key={range.busyRange.id} href={room.calendarHref} className="grid min-h-11 gap-0.5 rounded-xl bg-[#d99a2b] px-2 py-1.5 text-xs text-white" style={{ gridColumn: `${range.startIndex + 1} / span ${range.span}` }}><strong className="truncate">{range.busyRange.label || "Занято"}</strong><span className="truncate text-[10px] opacity-90">{formatShortDateLabel(range.busyRange.startsOn)} — {formatShortDateLabel(range.busyRange.endsOn)}</span></Link>)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-[var(--text-muted)]">В этой группе пока нет номеров для календаря занятости.</p>}
        </Panel>
      )) : (
        <Panel className="grid justify-items-start gap-3 p-5" surface="raised"><strong className="text-lg">Ничего не найдено</strong><p className="text-sm text-[var(--text-muted)]">Сбросьте фильтры, чтобы увидеть объекты и отдельные номера.</p></Panel>
      )}
    </section>
  );
}
