"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, ChevronLeft, ChevronRight, CircleHelp, Home } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import type { OwnerCalendarInventoryGroup, OwnerCalendarInventoryRoom } from "@/entities/property";
import type { OwnerBusyRange } from "@/entities/room";
import {
  addMonths,
  addDaysToDateKey,
  findBusyRangeForDate,
  formatDateKey,
  formatMonthLabel,
  formatShortDateLabel,
  getTimelineBusyRanges,
  startOfMonth,
  type TimelineDayCell,
} from "@/entities/room/model/calendar-helpers";
import { createRoomBusyRange, deleteRoomBusyRange, updateRoomBusyRange } from "@/features/property/owner-mutations";
import { cn } from "@/shared/lib/cn";
import { formatDateLabel } from "@/shared/lib/date";
import { AppIcon, BottomSheet, Button, IconButton, InlineNotice, Input, Select, Textarea } from "@/shared/ui";

type OwnerDashboardCalendarProps = {
  groups: OwnerCalendarInventoryGroup[];
  serverNotice?: string;
  serverNoticeTone?: "default" | "error";
};

type VisibleRoom = {
  group: OwnerCalendarInventoryGroup;
  room: OwnerCalendarInventoryRoom;
};

type ActiveEditor =
  | { mode: "create"; room: OwnerCalendarInventoryRoom; startsOn: string; endsOn: string }
  | { mode: "edit"; room: OwnerCalendarInventoryRoom; busyRange: OwnerBusyRange };

type DragState = {
  pointerId: number | null;
  startX: number;
  scrollLeft: number;
};

const DAY_WIDTH = 48;
const STRIP_DAY_COUNT = 93;
const shortWeekDays = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const shortMonthFormatter = new Intl.DateTimeFormat("ru-RU", { month: "short" });

function capitalize(value: string) {
  return value ? `${value[0].toLocaleUpperCase("ru-RU")}${value.slice(1)}` : value;
}

function getMonthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, 1);
}

function getStripDays(month: Date): TimelineDayCell[] {
  const start = startOfMonth(month);
  const todayKey = formatDateKey(new Date());

  return Array.from({ length: STRIP_DAY_COUNT }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = formatDateKey(date);

    return {
      key,
      date,
      dayLabel: String(date.getDate()),
      weekDayLabel: shortWeekDays[date.getDay()],
      isToday: key === todayKey,
    };
  });
}

function getDayPrice(room: OwnerCalendarInventoryRoom, dayKey: string) {
  const seasonalPrice = room.seasonalPrices.find(
    (item) => item.isActive && dayKey >= item.startsOn && dayKey <= item.endsOn,
  );

  return {
    value: seasonalPrice?.pricePerNight ?? room.pricePerNight,
    isSeasonal: Boolean(seasonalPrice),
  };
}

function formatCompactPrice(value: number) {
  if (value >= 10_000) return `${Math.round(value / 1_000)}к`;
  if (value >= 1_000) return `${(value / 1_000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}к`;
  return value.toLocaleString("ru-RU");
}

function getGroupIcon(group: OwnerCalendarInventoryGroup) {
  return group.kind === "property" ? Building2 : Home;
}

function getEditorTitle(editor: ActiveEditor | null) {
  return editor?.mode === "edit" ? "Изменить занятые даты" : "Отметить занятые даты";
}

export function OwnerDashboardCalendar({ groups, serverNotice = "", serverNoticeTone = "default" }: OwnerDashboardCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(today));
  const [groupId, setGroupId] = useState("all");
  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState>({ pointerId: null, startX: 0, scrollLeft: 0 });
  const didDragRef = useRef(false);

  const days = useMemo(() => getStripDays(currentMonth), [currentMonth]);
  const monthOptions = useMemo(
    () => Array.from({ length: 15 }, (_, index) => addMonths(currentMonth, index - 6)),
    [currentMonth],
  );
  const visibleRooms = useMemo<VisibleRoom[]>(
    () => groups
      .filter((group) => groupId === "all" || group.id === groupId)
      .flatMap((group) => group.rooms.map((room) => ({ group, room }))),
    [groupId, groups],
  );

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const todayIndex = days.findIndex((day) => day.isToday);
    const frameId = window.requestAnimationFrame(() => {
      scroller.scrollLeft = todayIndex >= 0 ? Math.max(0, todayIndex * DAY_WIDTH - DAY_WIDTH) : 0;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [days]);

  function openCreateEditor(room: OwnerCalendarInventoryRoom, dayKey: string) {
    if (didDragRef.current) return;
    setActiveEditor({ mode: "create", room, startsOn: dayKey, endsOn: addDaysToDateKey(dayKey, 1) });
  }

  function openBusyEditor(room: OwnerCalendarInventoryRoom, busyRange: OwnerBusyRange) {
    if (didDragRef.current) return;
    setActiveEditor({ mode: "edit", room, busyRange });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) {
      didDragRef.current = false;
      return;
    }
    const scroller = scrollerRef.current;
    if (!scroller) return;

    didDragRef.current = false;
    dragStateRef.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: scroller.scrollLeft };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    const scroller = scrollerRef.current;
    if (!scroller || dragState.pointerId !== event.pointerId) return;

    const delta = event.clientX - dragState.startX;
    if (Math.abs(delta) > 4 && !didDragRef.current) {
      didDragRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (didDragRef.current) scroller.scrollLeft = dragState.scrollLeft - delta;
  }

  function finishPointerDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragStateRef.current.pointerId = null;
  }

  function showToday() {
    setCurrentMonth(startOfMonth(today));
    window.requestAnimationFrame(() => {
      const todayIndex = getStripDays(startOfMonth(today)).findIndex((day) => day.isToday);
      if (scrollerRef.current && todayIndex >= 0) {
        scrollerRef.current.scrollTo({ left: Math.max(0, todayIndex * DAY_WIDTH - DAY_WIDTH), behavior: "smooth" });
      }
    });
  }

  const editorRoom = activeEditor?.room ?? null;

  return (
    <section className="grid min-w-0 gap-4">
      {serverNotice ? <InlineNotice tone={serverNoticeTone} aria-live="polite">{serverNotice}</InlineNotice> : null}

      <section className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]" aria-label="Общий календарь кабинета">
        <div className="grid gap-3 border-b border-[var(--border)] bg-[var(--surface)] p-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(132px,0.72fr)] gap-2 sm:max-w-[520px]">
            <Select
              id="calendar-placement-filter"
              aria-label="Показать размещения"
              value={groupId}
              onValueChange={setGroupId}
              className="min-w-0 bg-[var(--surface-subtle)] py-2 font-semibold"
              options={[
                { value: "all", label: `Все размещения · ${groups.reduce((sum, group) => sum + group.rooms.length, 0)}` },
                ...groups.map((group) => ({ value: group.id, label: `${group.title} · ${group.rooms.length}` })),
              ]}
            />
            <Select
              id="calendar-month-filter"
              aria-label="Выбрать месяц"
              value={getMonthKey(currentMonth)}
              onValueChange={(value) => setCurrentMonth(parseMonthKey(value))}
              className="min-w-0 bg-[var(--surface-subtle)] py-2 font-semibold"
              options={monthOptions.map((month) => ({ value: getMonthKey(month), label: capitalize(formatMonthLabel(month)) }))}
            />
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button size="sm" variant="secondary" className="rounded-full" onClick={showToday}>Сегодня</Button>
            <div className="flex items-center gap-1.5">
              <IconButton aria-label="Предыдущий месяц" className="size-[34px] shadow-none" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}><AppIcon icon={ChevronLeft} className="size-4" /></IconButton>
              <IconButton aria-label="Следующий месяц" className="size-[34px] shadow-none" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><AppIcon icon={ChevronRight} className="size-4" /></IconButton>
              <Button size="sm" variant="ghost" className="rounded-full px-2.5" onClick={() => setLegendOpen(true)}><AppIcon icon={CircleHelp} className="size-4" /><span className="max-[430px]:sr-only">Обозначения</span></Button>
            </div>
          </div>
        </div>

        <p id="calendar-scroll-help" className="border-b border-[var(--border)] px-3.5 py-2 text-[11px] leading-[1.4] text-[var(--text-muted)] sm:sr-only">Проведите по календарю влево или вправо, чтобы увидеть другие даты.</p>

        {visibleRooms.length ? (
          <div ref={scrollerRef} className="max-w-full cursor-grab overflow-x-auto overscroll-x-contain [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin] active:cursor-grabbing" aria-label="Сетка занятости по размещениям. Прокручивается по горизонтали." aria-describedby="calendar-scroll-help" tabIndex={0} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishPointerDrag} onPointerCancel={finishPointerDrag}>
            <div className="w-max min-w-full [--object-column:64px] md:[--object-column:168px]">
              <div className="sticky top-0 z-20 grid border-b border-[var(--border)]" style={{ gridTemplateColumns: "var(--object-column) auto" }}>
                <div className="sticky left-0 z-30 grid min-h-[58px] place-items-center border-r border-[var(--border)] bg-[var(--surface-subtle)] px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]"><span className="md:hidden">№</span><span className="hidden md:inline">Размещение</span></div>
                <div className="grid bg-[var(--surface-subtle)]" style={{ gridTemplateColumns: `repeat(${days.length}, ${DAY_WIDTH}px)` }}>
                  {days.map((day, index) => {
                    const startsMonth = index === 0 || day.date.getDate() === 1;
                    return (
                      <div key={day.key} className={cn("relative grid min-h-[58px] place-items-center border-r border-[var(--border)] px-0.5 pb-1 pt-3 text-[10px] text-[var(--text-muted)]", startsMonth && index > 0 && "border-l-2 border-l-[var(--border-strong)]", day.isToday && "bg-[var(--color-primary-pale)] text-[var(--accent-strong)]")}>
                        {startsMonth ? <span className="absolute left-1 top-0.5 text-[8px] font-bold uppercase tracking-[0.06em]">{shortMonthFormatter.format(day.date)}</span> : null}
                        <strong className={cn("text-[13px] leading-none text-[var(--text)]", day.isToday && "text-[var(--accent-strong)]")}>{day.dayLabel}</strong>
                        <span>{day.weekDayLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {visibleRooms.map(({ group, room }, rowIndex) => {
                const visibleRanges = getTimelineBusyRanges(room.busyRanges, days);
                const GroupIcon = getGroupIcon(group);

                return (
                  <div key={room.id} className="grid border-b border-[var(--border)] last:border-b-0" style={{ gridTemplateColumns: "var(--object-column) auto" }}>
                    <Link href={room.calendarHref} className="sticky left-0 z-10 grid min-h-[58px] min-w-0 place-items-center border-r border-[var(--border)] bg-[var(--surface)] p-1.5 text-inherit transition-colors hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_rgb(var(--color-primary-rgb)_/_0.18)] md:grid-cols-[38px_minmax(0,1fr)] md:justify-items-stretch md:gap-2 md:px-2" aria-label={`${group.title}, ${room.title}. Открыть детальный календарь.`}>
                      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-[var(--surface-muted)] text-[var(--accent-strong)] md:size-[38px]">
                        {room.coverImageUrl ? <Image src={room.coverImageUrl} alt="" fill sizes="40px" className="object-cover" unoptimized /> : <AppIcon icon={GroupIcon} className="size-4" />}
                        <span className="absolute bottom-0 right-0 grid size-4 place-items-center rounded-tl-md bg-[rgb(17_29_27_/_0.72)] text-[8px] font-bold text-white md:hidden">{rowIndex + 1}</span>
                      </span>
                      <span className="hidden min-w-0 md:grid"><small className="truncate text-[9px] leading-tight text-[var(--text-muted)]">{group.title}</small><strong className="truncate text-[11px] leading-tight text-[var(--text)]">{room.title}</strong></span>
                    </Link>

                    <div className="relative min-h-[58px]" style={{ width: days.length * DAY_WIDTH }}>
                      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${days.length}, ${DAY_WIDTH}px)` }}>
                        {days.map((day, dayIndex) => {
                          const busyRange = findBusyRangeForDate(room.busyRanges, day.key);
                          const price = getDayPrice(room, day.key);
                          const startsMonth = dayIndex > 0 && day.date.getDate() === 1;

                          return (
                            <button key={`${room.id}-${day.key}`} type="button" tabIndex={busyRange ? -1 : 0} className={cn("grid min-h-[58px] place-items-center border-r border-[var(--border)] bg-[var(--surface)] px-0.5 text-[9px] text-[var(--text-muted)] transition-colors hover:bg-[var(--color-primary-pale)] focus-visible:z-10 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]", startsMonth && "border-l-2 border-l-[var(--border-strong)]", day.isToday && "bg-[rgb(var(--color-primary-rgb)_/_0.055)] shadow-[inset_0_2px_0_var(--accent)]", price.isSeasonal && !busyRange && "bg-[var(--surface-subtle)]")} onClick={() => busyRange ? openBusyEditor(room, busyRange) : openCreateEditor(room, day.key)} aria-label={`${room.title}: ${formatDateLabel(day.key)}. ${busyRange ? "Занято" : "Свободно"}. Цена ${price.value.toLocaleString("ru-RU")} рублей за ночь.`}>
                              {!busyRange ? <span className={cn("font-semibold", price.isSeasonal && "text-[var(--accent-strong)]")}>{formatCompactPrice(price.value)}</span> : null}
                            </button>
                          );
                        })}
                      </div>

                      <div className="pointer-events-none absolute inset-x-0 top-[6px] grid h-[46px]" style={{ gridTemplateColumns: `repeat(${days.length}, ${DAY_WIDTH}px)` }}>
                        {visibleRanges.map((range) => (
                          <button key={range.busyRange.id} type="button" className="pointer-events-auto relative z-[2] grid min-w-0 content-center overflow-hidden rounded-[8px] border border-[rgb(var(--color-primary-rgb)_/_0.18)] bg-[var(--accent)] px-2 text-left text-[9px] leading-[1.2] text-white shadow-[0_2px_6px_rgb(17_29_27_/_0.14)] transition-colors hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2" style={{ gridColumn: `${range.startIndex + 1} / span ${range.span}` }} onClick={() => openBusyEditor(room, range.busyRange)} aria-label={`${room.title}: ${range.busyRange.label || "Занятые даты"}, ${formatDateLabel(range.busyRange.startsOn)} — ${formatDateLabel(range.busyRange.endsOn)}. Изменить.`}>
                            <strong className="truncate text-[10px]">{range.clippedStart ? "… " : ""}{range.busyRange.label || "Занято"}{range.clippedEnd ? " …" : ""}</strong>
                            {range.span >= 3 ? <span className="truncate opacity-80">{formatShortDateLabel(range.busyRange.startsOn)} — {formatShortDateLabel(range.busyRange.endsOn)}</span> : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid justify-items-start gap-2 p-5"><strong className="text-base text-[var(--text)]">В этой группе пока нет номеров</strong><p className="text-sm text-[var(--text-muted)]">Выберите другое размещение или покажите весь календарь.</p><Button size="sm" variant="secondary" onClick={() => setGroupId("all")}>Показать все</Button></div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-[var(--text-muted)]">
        <span>Цена указана за ночь. Нажмите на дату или занятый диапазон для редактирования.</span>
        <Link href={editorRoom?.calendarHref ?? visibleRooms[0]?.room.calendarHref ?? "/dashboard/properties"} className="font-bold text-[var(--accent-strong)] hover:underline">Детальный календарь</Link>
      </div>

      <BottomSheet open={Boolean(activeEditor)} onOpenChange={(open) => { if (!open) setActiveEditor(null); }} title={getEditorTitle(activeEditor)} description={editorRoom ? `${editorRoom.title}. Изменения сохранятся в календаре занятости.` : undefined} closeLabel="Закрыть редактор" desktopSidePanel rootClassName="md:items-stretch md:justify-end md:pt-0" className="max-[640px]:max-h-[94vh] md:mt-0 md:h-full md:max-h-none md:max-w-[460px] md:rounded-none md:rounded-l-[24px]" bodyClassName="gap-4">
        {activeEditor ? (
          <form action={activeEditor.mode === "edit" ? updateRoomBusyRange : createRoomBusyRange} className="grid gap-4">
            <input type="hidden" name="returnPath" value="/dashboard/calendar" />
            <input type="hidden" name="propertyId" value={activeEditor.room.propertyId ?? ""} />
            <input type="hidden" name="roomId" value={activeEditor.room.id} />
            {activeEditor.mode === "edit" ? <input type="hidden" name="busyRangeId" value={activeEditor.busyRange.id} /> : null}
            <div className="grid grid-cols-2 gap-3">
              <Input key={`${activeEditor.mode}-start-${activeEditor.mode === "edit" ? activeEditor.busyRange.id : activeEditor.startsOn}`} id="dashboard-busy-start" name="startsOn" type="date" label="Заезд" defaultValue={activeEditor.mode === "edit" ? activeEditor.busyRange.startsOn : activeEditor.startsOn} required />
              <Input key={`${activeEditor.mode}-end-${activeEditor.mode === "edit" ? activeEditor.busyRange.id : activeEditor.endsOn}`} id="dashboard-busy-end" name="endsOn" type="date" label="Выезд" defaultValue={activeEditor.mode === "edit" ? activeEditor.busyRange.endsOn : activeEditor.endsOn} required />
            </div>
            <Input id="dashboard-busy-label" name="label" label="Пометка" placeholder="Например, заявка" defaultValue={activeEditor.mode === "edit" ? activeEditor.busyRange.label : ""} />
            <Textarea id="dashboard-busy-note" name="note" label="Комментарий" placeholder="Необязательный комментарий" rows={4} defaultValue={activeEditor.mode === "edit" ? activeEditor.busyRange.note : ""} />
            <p className="rounded-[var(--radius-md)] bg-[var(--surface-subtle)] px-3 py-2.5 text-xs leading-[1.5] text-[var(--text-muted)]">Дата выезда не занимает ночь и доступна для следующего заезда. Отметка занятости не подтверждает заявку на проживание автоматически.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeEditor.mode === "edit" ? <Button type="submit" variant="danger" formAction={deleteRoomBusyRange}>Удалить диапазон</Button> : <Button type="button" variant="secondary" onClick={() => setActiveEditor(null)}>Отменить</Button>}
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        ) : null}
      </BottomSheet>

      <BottomSheet open={legendOpen} onOpenChange={setLegendOpen} title="Обозначения календаря" description="Сетка показывает занятость и фактическую цену каждого дня." closeLabel="Закрыть обозначения" className="md:max-w-[460px]">
        <div className="grid gap-2.5">
          <div className="grid grid-cols-[20px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3"><span className="size-4 rounded bg-[var(--surface)] ring-1 ring-[var(--border)]" aria-hidden="true" /><span className="text-sm"><strong className="block text-[var(--text)]">Свободный день</strong><small className="text-[var(--text-muted)]">В ячейке показана цена за ночь.</small></span></div>
          <div className="grid grid-cols-[20px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3"><span className="h-4 w-5 rounded bg-[var(--accent)]" aria-hidden="true" /><span className="text-sm"><strong className="block text-[var(--text)]">Занятые даты</strong><small className="text-[var(--text-muted)]">Непрерывная полоса объединяет весь период.</small></span></div>
          <div className="grid grid-cols-[20px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3"><span className="size-4 border-t-2 border-[var(--accent)] bg-[var(--color-primary-pale)]" aria-hidden="true" /><span className="text-sm"><strong className="block text-[var(--text)]">Сегодня</strong><small className="text-[var(--text-muted)]">Текущая дата выделена зелёной линией.</small></span></div>
          <div className="grid grid-cols-[20px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3"><span className="size-4 rounded bg-[var(--surface-subtle)]" aria-hidden="true" /><span className="text-sm"><strong className="block text-[var(--text)]">Сезонная цена</strong><small className="text-[var(--text-muted)]">Цена выделена цветом, когда для дня действует сезон.</small></span></div>
        </div>
      </BottomSheet>
    </section>
  );
}
