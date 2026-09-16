"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Home } from "lucide-react";
import Link from "next/link";

import type { OwnerCalendarInventoryGroup, OwnerCalendarInventoryRoom } from "@/entities/property";
import {
  addMonths,
  formatDateKey,
  formatMonthLabel,
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
import { cn } from "@/shared/lib/cn";
import { formatDateLabel } from "@/shared/lib/date";
import { AppIcon, Button, ButtonLink, IconButton } from "@/shared/ui";

type OwnerDashboardCalendarProps = { groups: OwnerCalendarInventoryGroup[] };
type GroupFilterKind = "all" | "property" | "standalone";

const filterClass =
  "inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--text-muted)] transition-[border-color,background-color,color] duration-[180ms] hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]";
const activeFilterClass = "border-[var(--accent)] bg-[var(--color-primary-pale)] text-[var(--accent-strong)]";

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

function capitalizeFirstLetter(value: string) {
  return value ? `${value[0].toLocaleUpperCase("ru-RU")}${value.slice(1)}` : value;
}

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
  const calendarColumnsStyle = {
    "--calendar-columns": String(visibleTimelineDays.length),
  } as CSSProperties;

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

  function resetFilters() {
    setGroupFilter("all");
    setSelectedGroupId("all");
  }

  return (
    <section className="grid gap-6 max-[640px]:gap-5">
      <section className="grid gap-5 border-y border-[var(--border)] px-1 py-5 max-[640px]:gap-4 max-[640px]:px-0 max-[640px]:py-4" aria-label="Управление календарём">
        <div className="flex items-center justify-between gap-5 max-[640px]:items-start">
          <div className="grid gap-1">
            <strong className="text-[22px] leading-tight tracking-[-0.025em] text-[var(--text)] max-[640px]:text-xl">
              {capitalizeFirstLetter(formatMonthLabel(currentMonth))}
            </strong>
            <span className="text-xs text-[var(--text-muted)]">{formatMonthRangeLabel(currentMonth)}</span>
          </div>
          <div className="flex items-center gap-2 max-[640px]:w-[152px] max-[640px]:flex-wrap max-[640px]:justify-end">
            <IconButton aria-label="Предыдущий месяц" className="size-11" onClick={() => updateMonth(addMonths(currentMonth, -1))}>
              <AppIcon icon={ChevronLeft} />
            </IconButton>
            <Button
              variant="secondary"
              className="rounded-full max-[640px]:order-3 max-[640px]:w-full max-[640px]:px-3"
              onClick={() => updateMonth(startOfMonth(new Date()))}
            >
              Текущий месяц
            </Button>
            <IconButton aria-label="Следующий месяц" className="size-11" onClick={() => updateMonth(addMonths(currentMonth, 1))}>
              <AppIcon icon={ChevronRight} />
            </IconButton>
          </div>
        </div>

        <dl className="grid grid-cols-3">
          <div className="min-w-0 pr-5 max-[640px]:pr-2">
            <dd className="text-2xl font-semibold tracking-[-0.035em] text-[var(--text)] max-[640px]:text-xl">{visibleRooms.length}</dd>
            <dt className="mt-1.5 text-xs leading-[1.35] text-[var(--text-muted)] max-[640px]:text-[10px]">Номера в обзоре</dt>
            <small className="mt-1 block text-[11px] text-[var(--text-muted)] max-[640px]:hidden">После фильтров</small>
          </div>
          <div className="min-w-0 border-l border-[var(--border)] px-5 max-[640px]:px-2">
            <dd className="text-2xl font-semibold tracking-[-0.035em] text-[var(--text)] max-[640px]:text-xl">{busyRoomsInView}</dd>
            <dt className="mt-1.5 text-xs leading-[1.35] text-[var(--text-muted)] max-[640px]:text-[10px]">Заняты в месяце</dt>
            <small className="mt-1 block text-[11px] text-[var(--text-muted)] max-[640px]:hidden">Есть занятые даты</small>
          </div>
          <div className="min-w-0 border-l border-[var(--border)] pl-5 max-[640px]:pl-2">
            <dd className="text-[17px] font-semibold leading-tight tracking-[-0.025em] text-[var(--text)] max-[640px]:text-[13px]">
              {nearestBusyRange ? `${formatShortDateLabel(nearestBusyRange.startsOn)} — ${formatShortDateLabel(nearestBusyRange.endsOn)}` : "Нет занятых дат"}
            </dd>
            <dt className="mt-1.5 text-xs leading-[1.35] text-[var(--text-muted)] max-[640px]:text-[10px]">Ближайший период</dt>
            <small className="mt-1 block truncate text-[11px] text-[var(--text-muted)] max-[640px]:hidden">{nearestBusyRange?.label || "Свободные даты"}</small>
          </div>
        </dl>

        <div className="grid gap-2.5">
          <strong className="text-xs text-[var(--text)]">Показать размещения</strong>
          <div className="flex max-w-full gap-2 overflow-x-auto px-0.5 pb-1" aria-label="Тип размещения">
            {([["all", "Все"], ["property", "Объекты"], ["standalone", "Отдельные номера"]] as const).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                className={cn(filterClass, groupFilter === kind && activeFilterClass)}
                aria-pressed={groupFilter === kind}
                onClick={() => {
                  setGroupFilter(kind);
                  setSelectedGroupId("all");
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto px-0.5 pb-1" aria-label="Группа календаря">
            <button
              type="button"
              className={cn(filterClass, selectedGroupId === "all" && activeFilterClass)}
              aria-pressed={selectedGroupId === "all"}
              onClick={() => setSelectedGroupId("all")}
            >
              Все группы
            </button>
            {groupsByKind.map((group) => (
              <button
                key={group.id}
                type="button"
                className={cn(filterClass, selectedGroupId === group.id && activeFilterClass)}
                aria-pressed={selectedGroupId === group.id}
                onClick={() => setSelectedGroupId(group.id)}
              >
                {group.title} · {group.rooms.length}
              </button>
            ))}
          </div>
        </div>
      </section>

      {visibleGroups.length ? (
        <section className="min-w-0 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[rgb(255_250_243_/_0.94)] max-[640px]:rounded-[20px]" aria-label="Общий календарь кабинета">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-[18px] max-[640px]:items-start max-[640px]:px-4 max-[640px]:py-4">
            <div className="grid gap-1">
              <strong className="text-[15px] text-[var(--text)]">{windowLabel}</strong>
              <span className="text-[11px] text-[var(--text-muted)]">{visibleTimelineDays.length} дней в видимом окне</span>
            </div>
            <div className="flex items-center gap-2">
              <IconButton aria-label="Показать предыдущие дни" className="size-10" disabled={!canMoveBackward} onClick={() => shiftWindow(-1)}>
                <AppIcon icon={ChevronLeft} />
              </IconButton>
              <IconButton aria-label="Показать следующие дни" className="size-10" disabled={!canMoveForward} onClick={() => shiftWindow(1)}>
                <AppIcon icon={ChevronRight} />
              </IconButton>
            </div>
          </div>

          <p id="owner-calendar-scroll-help" className="hidden px-4 pt-3 text-[11px] leading-[1.45] text-[var(--text-muted)] max-[640px]:block">
            Прокрутите сетку по горизонтали, чтобы увидеть другие даты.
          </p>
          <div
            className="max-w-full overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_rgb(var(--color-primary-rgb)_/_0.22)]"
            tabIndex={0}
            aria-label="Сетка занятости по номерам. Прокручивается по горизонтали."
            aria-describedby="owner-calendar-scroll-help"
            data-calendar-scroller
          >
            <div
              className="min-w-[calc(190px+(var(--calendar-columns)*44px))]"
              style={calendarColumnsStyle}
              data-calendar-canvas
            >
              <div className="grid grid-cols-[190px_minmax(0,1fr)] border-b border-[var(--border)] bg-[var(--surface)] max-[640px]:grid-cols-[178px_minmax(0,1fr)]">
                <div className="sticky left-0 z-20 border-r border-[var(--border)] bg-[var(--surface)]" />
                <div className="grid" style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(44px, 1fr))` }}>
                  {visibleTimelineDays.map((day) => (
                    <div
                      key={day.key}
                      className={cn(
                        "grid min-h-[58px] place-items-center border-r border-[rgb(229_217_202_/_0.72)] text-[10px] text-[var(--text-muted)] last:border-r-0",
                        day.isToday && "bg-[var(--color-primary-pale)] text-[var(--accent-strong)]",
                      )}
                    >
                      <span className="grid place-items-center gap-0.5"><strong className="text-[13px] text-[var(--text)]">{day.dayLabel}</strong>{day.weekDayLabel}</span>
                    </div>
                  ))}
                </div>
              </div>

              {visibleGroups.map((group) => (
                <section key={group.id} className="border-b border-[var(--border)] last:border-b-0">
                  <div className="flex items-start justify-between gap-4 px-5 py-5 max-[640px]:px-4 max-[640px]:py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[var(--color-primary-pale)] text-[var(--accent-strong)]">
                        <AppIcon icon={group.kind === "property" ? Building2 : Home} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--text)]">{group.title}</h2>
                        <p className="mt-1 text-xs leading-[1.45] text-[var(--text-muted)]">{group.subtitle}</p>
                      </div>
                    </div>
                    {group.kind === "property" ? (
                      <div className="flex shrink-0 flex-wrap justify-end gap-2 max-[520px]:flex-col">
                        <ButtonLink href={group.detailHref} variant="secondary" size="sm">Открыть объект</ButtonLink>
                        <ButtonLink href={group.calendarHref} size="sm">Редактировать даты</ButtonLink>
                      </div>
                    ) : null}
                  </div>

                  {group.rooms.length ? group.rooms.map((room) => {
                    const ranges = getTimelineBusyRanges(room.busyRanges, visibleTimelineDays);
                    return (
                      <div key={room.id} className="grid min-h-[78px] grid-cols-[190px_minmax(0,1fr)] border-t border-[rgb(229_217_202_/_0.76)] max-[640px]:grid-cols-[178px_minmax(0,1fr)]">
                        <Link
                          href={room.calendarHref}
                          className="sticky left-0 z-10 grid min-w-0 content-center border-r border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-inherit hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_rgb(var(--color-primary-rgb)_/_0.18)]"
                        >
                          <strong className="truncate text-[13px]">{room.title}</strong>
                          <small className="mt-1 truncate text-[10px] text-[var(--text-muted)]">{getRoomSummary(room)}</small>
                        </Link>
                        <div className="relative min-h-[78px]">
                          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(44px, 1fr))` }}>
                            {visibleTimelineDays.map((day) => {
                              const busy = room.busyRanges.find((range) => day.key >= range.startsOn && day.key <= range.endsOn);
                              return (
                                <div
                                  key={`${room.id}-${day.key}`}
                                  className={cn(
                                    "border-r border-[rgb(229_217_202_/_0.7)] bg-[rgb(255_255_255_/_0.68)] last:border-r-0",
                                    busy && "bg-[rgb(217_154_43_/_0.18)]",
                                    day.isToday && "shadow-[inset_0_0_0_2px_var(--accent)]",
                                  )}
                                  aria-label={`${room.title}: ${formatDateLabel(day.date)}. ${busy ? "Занято" : "Свободно"}.`}
                                />
                              );
                            })}
                          </div>
                          <div className="pointer-events-none absolute inset-x-0 top-1/2 grid -translate-y-1/2" style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(44px, 1fr))` }}>
                            {ranges.map((range) => (
                              <Link
                                key={range.busyRange.id}
                                href={room.calendarHref}
                                className="pointer-events-auto grid min-h-[58px] content-center overflow-hidden rounded-[9px] bg-[#d99a2b] px-2 py-1.5 text-[10px] leading-tight text-[var(--text)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(217_154_43_/_0.22)]"
                                style={{ gridColumn: `${range.startIndex + 1} / span ${range.span}` }}
                                aria-label={`${room.title}: ${range.busyRange.label || "Занято"}, ${formatDateLabel(range.busyRange.startsOn)} — ${formatDateLabel(range.busyRange.endsOn)}. Открыть календарь.`}
                              >
                                <strong className="truncate">{range.busyRange.label || "Занято"}</strong>
                                <span className="mt-1 truncate opacity-90">{formatShortDateLabel(range.busyRange.startsOn)} — {formatShortDateLabel(range.busyRange.endsOn)}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="border-t border-[var(--border)] px-5 py-4 text-sm text-[var(--text-muted)]">В этой группе пока нет номеров для календаря занятости.</p>
                  )}
                </section>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] px-5 py-3.5 text-[11px] text-[var(--text-muted)] max-[640px]:px-4" aria-label="Обозначения календаря">
            <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full border border-[var(--border)] bg-white" aria-hidden="true" />Свободно</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#d99a2b]" aria-hidden="true" />Занятые даты</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />Сегодня</span>
          </div>
        </section>
      ) : (
        <section className="grid justify-items-start gap-3 border-y border-[var(--border)] px-1 py-6">
          <strong className="text-lg text-[var(--text)]">Ничего не найдено</strong>
          <p className="text-sm text-[var(--text-muted)]">Сбросьте фильтры, чтобы увидеть объекты и отдельные номера.</p>
          <Button variant="secondary" onClick={resetFilters}>Сбросить фильтры</Button>
        </section>
      )}
    </section>
  );
}
