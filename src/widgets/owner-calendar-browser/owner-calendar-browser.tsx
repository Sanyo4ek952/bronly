"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Dot, PencilLine } from "lucide-react";

import { createRoomBusyRange, deleteRoomBusyRange, updateRoomBusyRange } from "@/features/property/owner-mutations";
import type { OwnerBusyRange } from "@/entities/room";
import { cn } from "@/shared/lib/cn";
import { formatDateLabel } from "@/shared/lib/date";
import { AppIcon, Button, IconButton, InlineNotice, Input, StatCard, Textarea } from "@/shared/ui";
import {
  addMonths,
  formatDateKey,
  formatMonthLabel,
  formatMonthRangeLabel,
  formatShortDateLabel,
  getMonthDays,
  getNearestBusyRange,
  getTimelineBusyRanges,
  getTimelineDays,
  getTimelineStartIndex,
  getVisibleTimelineDays,
  hasBusyOverlap,
  normalizeDateRange,
  parseDateKey,
  startOfMonth,
  useTimelineVisibleDayCount,
  weekDays,
} from "@/entities/room/model/calendar-helpers";

type OwnerCalendarRoom = {
  id: string;
  title: string;
  pricePerNight: number;
  busyRanges: OwnerBusyRange[];
};

type OwnerCalendarBrowserProps = {
  propertyId?: string;
  rooms: OwnerCalendarRoom[];
  serverNotice?: string;
  serverNoticeTone?: "default" | "error";
};

type ActiveEditorState =
  | {
      mode: "create";
      roomId: string;
      startsOn: string;
      endsOn: string;
    }
  | {
      mode: "edit";
      roomId: string;
      busyRange: OwnerBusyRange;
    };

const stackClass = "grid gap-4";
const shellClass =
  "grid gap-[14px] overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.98)] max-[720px]:rounded-[20px]";
const shellHeaderClass =
  "flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_243_236_/_0.82)),var(--surface)] px-5 py-[18px] max-[720px]:px-4";
const shellLegendClass =
  "flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-5 py-3 text-[13px] text-[var(--text-muted)] max-[720px]:px-4";
const editorCardClass =
  "grid gap-4 rounded-[22px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-[18px] max-[720px]:rounded-[20px] max-[720px]:p-4";
const actionGridClass = "grid auto-cols-max grid-flow-col gap-2 max-[640px]:grid-flow-row";
const timelineCellClass =
  "h-10 rounded-xl border border-transparent bg-[rgb(248_250_252_/_0.85)] transition-[transform,border-color,background-color] duration-[180ms] hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)]";

function formatRoomPrice(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function getPanelTitle(activeEditor: ActiveEditorState | null) {
  if (!activeEditor) {
    return "Выберите даты";
  }

  return activeEditor.mode === "create" ? "Новые занятые даты" : "Редактирование диапазона";
}

function getPanelDescription(activeEditor: ActiveEditorState | null) {
  if (!activeEditor) {
    return "Выберите свободные даты в сетке или откройте существующий диапазон ниже.";
  }

  if (activeEditor.mode === "create") {
    return "Проверьте даты и при необходимости добавьте пометку или комментарий.";
  }

  return "Обновите даты, пометку или комментарий для выбранного диапазона.";
}

function getRoomSummary(room: OwnerCalendarRoom) {
  if (!room.busyRanges.length) {
    return "Свободно";
  }

  return `${room.busyRanges.length} занятых диапазонов`;
}

function getTimelineRangeLabel(range: OwnerBusyRange) {
  return range.label || "Занято";
}

function getSelectionNotice(selectionStart: string | null) {
  return selectionStart
    ? `Начало диапазона выбрано: ${formatDateLabel(selectionStart)}.`
    : "Кликните по двум датам, чтобы отметить занятый диапазон.";
}

function getDefaultTimelineAnchorKey(month: Date) {
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth();

  return isCurrentMonth ? formatDateKey(today) : formatDateKey(startOfMonth(month));
}

export function OwnerCalendarBrowser({ propertyId = "", rooms, serverNotice = "", serverNoticeTone = "default" }: OwnerCalendarBrowserProps) {
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id ?? "");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<ActiveEditorState | null>(null);
  const [localNotice, setLocalNotice] = useState("");
  const [timelineAnchorKey, setTimelineAnchorKey] = useState(() => getDefaultTimelineAnchorKey(new Date()));

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0] ?? null,
    [rooms, selectedRoomId],
  );
  const monthDays = useMemo(
    () => (selectedRoom ? getMonthDays(currentMonth, selectedRoom.busyRanges) : []),
    [currentMonth, selectedRoom],
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
    () => (selectedRoom ? getNearestBusyRange(selectedRoom.busyRanges) : null),
    [selectedRoom],
  );
  const selectedBusyRangeId = activeEditor?.mode === "edit" ? activeEditor.busyRange.id : null;
  const canMoveTimelineBackward = timelineStartIndex > 0;
  const canMoveTimelineForward = timelineStartIndex + visibleTimelineDays.length < timelineDays.length;
  const timelineWindowLabel = visibleTimelineDays.length
    ? `${formatShortDateLabel(visibleTimelineDays[0].key)} - ${formatShortDateLabel(visibleTimelineDays[visibleTimelineDays.length - 1].key)}`
    : formatMonthRangeLabel(currentMonth);

  function handleRoomFocus(roomId: string) {
    setSelectedRoomId(roomId);
    setSelectionStart(null);
    setLocalNotice("");
  }

  function handleTimelineCellClick(room: OwnerCalendarRoom, dayKey: string) {
    setSelectedRoomId(room.id);
    setLocalNotice("");

    const dayBusyRange = room.busyRanges.find((range) => dayKey >= range.startsOn && dayKey <= range.endsOn) ?? null;

    if (dayBusyRange) {
      setSelectionStart(null);
      setActiveEditor({
        mode: "edit",
        roomId: room.id,
        busyRange: dayBusyRange,
      });
      return;
    }

    if (!selectionStart || selectedRoomId !== room.id) {
      setSelectionStart(dayKey);
      setActiveEditor(null);
      return;
    }

    const nextRange = normalizeDateRange(selectionStart, dayKey);

    if (hasBusyOverlap(room.busyRanges, nextRange.startsOn, nextRange.endsOn)) {
      setSelectionStart(null);
      setActiveEditor(null);
      setLocalNotice("Выбранный диапазон пересекается с уже отмеченными занятыми датами.");
      return;
    }

    setSelectionStart(null);
    setActiveEditor({
      mode: "create",
      roomId: room.id,
      startsOn: nextRange.startsOn,
      endsOn: nextRange.endsOn,
    });
  }

  function handleOpenBusyRange(roomId: string, busyRange: OwnerBusyRange) {
    setSelectedRoomId(roomId);
    setSelectionStart(null);
    setActiveEditor({
      mode: "edit",
      roomId,
      busyRange,
    });

    const visibleMonth = parseDateKey(busyRange.startsOn);
    setCurrentMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1));
    setTimelineAnchorKey(busyRange.startsOn);
    setLocalNotice("");
  }

  function updateMonth(nextMonth: Date) {
    setCurrentMonth(nextMonth);
    setTimelineAnchorKey(getDefaultTimelineAnchorKey(nextMonth));
  }

  function shiftTimelineWindow(direction: -1 | 1) {
    if (!timelineDays.length) {
      return;
    }

    const nextIndex = direction < 0
      ? Math.max(0, timelineStartIndex - visibleDayCount)
      : Math.min(Math.max(0, timelineDays.length - visibleDayCount), timelineStartIndex + visibleDayCount);
    const nextDay = timelineDays[nextIndex];

    if (nextDay) {
      setTimelineAnchorKey(nextDay.key);
    }
  }

  function renderEditorPanel() {
    if (!selectedRoom) {
      return null;
    }

    if (!activeEditor) {
      return (
        <section className={editorCardClass}>
          <div className="grid gap-1.5">
            <strong className="text-base font-semibold leading-[1.25] text-[var(--color-text)]">{getPanelTitle(activeEditor)}</strong>
            <p className="text-[13px] leading-[1.5] text-[var(--color-muted)]">{getPanelDescription(activeEditor)}</p>
          </div>
          <div className="grid gap-2 rounded-[18px] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.92)] px-4 py-4">
            <strong className="text-sm font-semibold text-[var(--color-text)]">Отмечайте занятые даты прямо в сетке</strong>
            <p className="text-sm leading-[1.5] text-[var(--color-muted)]">{getSelectionNotice(selectionStart)}</p>
            <p className="text-sm leading-[1.5] text-[var(--color-muted)]">Клик по занятому диапазону откроет его для редактирования.</p>
          </div>
        </section>
      );
    }

    if (activeEditor.mode === "create") {
      return (
        <form action={createRoomBusyRange} className={editorCardClass}>
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="roomId" value={activeEditor.roomId} />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1.5">
              <strong className="text-base font-semibold leading-[1.25] text-[var(--color-text)]">{getPanelTitle(activeEditor)}</strong>
              <p className="text-[13px] leading-[1.5] text-[var(--color-muted)]">{getPanelDescription(activeEditor)}</p>
            </div>
            <button type="button" className="text-sm font-bold text-[var(--color-primary)]" onClick={() => setActiveEditor(null)}>
              Отменить
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="owner-busy-new-start" name="startsOn" type="date" label="С" defaultValue={activeEditor.startsOn} />
            <Input id="owner-busy-new-end" name="endsOn" type="date" label="По" defaultValue={activeEditor.endsOn} />
            <Input id="owner-busy-new-label" name="label" label="Пометка" placeholder="Например, заявка" wrapperClassName="grid gap-1.5 md:col-span-2" />
            <Textarea id="owner-busy-new-note" name="note" label="Комментарий" rows={3} wrapperClassName="grid gap-1.5 md:col-span-2" />
          </div>
          <div className={actionGridClass}>
            <Button type="button" variant="secondary" onClick={() => setActiveEditor(null)}>
              Отменить
            </Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      );
    }

    return (
      <form action={updateRoomBusyRange} className={editorCardClass}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="busyRangeId" value={activeEditor.busyRange.id} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <strong className="text-base font-semibold leading-[1.25] text-[var(--color-text)]">{getPanelTitle(activeEditor)}</strong>
            <p className="text-[13px] leading-[1.5] text-[var(--color-muted)]">{getPanelDescription(activeEditor)}</p>
          </div>
          <button type="button" className="text-sm font-bold text-[var(--color-primary)]" onClick={() => setActiveEditor(null)}>
            Отменить
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id={`owner-busy-edit-start-${activeEditor.busyRange.id}`}
            name="startsOn"
            type="date"
            label="С"
            defaultValue={activeEditor.busyRange.startsOn}
          />
          <Input
            id={`owner-busy-edit-end-${activeEditor.busyRange.id}`}
            name="endsOn"
            type="date"
            label="По"
            defaultValue={activeEditor.busyRange.endsOn}
          />
          <Input
            id={`owner-busy-edit-label-${activeEditor.busyRange.id}`}
            name="label"
            label="Пометка"
            defaultValue={activeEditor.busyRange.label}
            wrapperClassName="grid gap-1.5 md:col-span-2"
          />
          <Textarea
            id={`owner-busy-edit-note-${activeEditor.busyRange.id}`}
            name="note"
            label="Комментарий"
            rows={3}
            defaultValue={activeEditor.busyRange.note}
            wrapperClassName="grid gap-1.5 md:col-span-2"
          />
        </div>
        <div className={actionGridClass}>
          <Button type="submit" variant="danger" formAction={deleteRoomBusyRange}>
            Удалить
          </Button>
          <Button type="submit">Сохранить</Button>
        </div>
      </form>
    );
  }

  return (
    <section className={stackClass}>
      {(serverNotice || localNotice) ? <InlineNotice tone={localNotice ? "error" : serverNoticeTone}>{serverNotice || localNotice}</InlineNotice> : null}

      <section className={shellClass}>
        <div className={shellHeaderClass}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[rgb(var(--color-primary-rgb)_/_0.08)] text-[var(--accent-strong)]">
              <AppIcon icon={CalendarDays} className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[28px] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--text)]">Календарь занятости</h3>
              <p className="text-sm text-[var(--text-muted)]">{formatMonthRangeLabel(currentMonth)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <IconButton
              aria-label="Предыдущий месяц"
              className="size-[42px]"
              onClick={() => updateMonth(addMonths(currentMonth, -1))}
            >
              <AppIcon icon={ChevronLeft} />
            </IconButton>
            <Button
              variant="secondary"
              className="min-w-[152px] rounded-full"
              onClick={() => {
                const today = new Date();
                updateMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              }}
            >
              Текущий месяц
            </Button>
            <IconButton
              aria-label="Следующий месяц"
              className="size-[42px]"
              onClick={() => updateMonth(addMonths(currentMonth, 1))}
            >
              <AppIcon icon={ChevronRight} />
            </IconButton>
          </div>
        </div>

        <div className={shellLegendClass}>
          <span className="inline-flex items-center gap-1.5"><Dot className="h-[14px] w-[14px] text-[#f2c94c]" />Свободно</span>
          <span className="inline-flex items-center gap-1.5"><Dot className="h-[14px] w-[14px] text-[#d99a2b]" />Занятые даты</span>
          <span className="inline-flex items-center gap-1.5"><Dot className="h-[14px] w-[14px] text-[var(--accent)]" />Сегодня</span>
          <span className="inline-flex items-center gap-1.5"><Dot className="h-[14px] w-[14px] text-[#7c6fd6]" />Выбранное начало</span>
          <span className="inline-flex items-center gap-1.5"><Dot className="h-[14px] w-[14px] text-[#3b6ea8]" />Активный диапазон</span>
        </div>

        <div className="grid gap-3 px-0 pb-[18px] pt-3">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-2.5 max-[720px]:px-4">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <strong className="text-sm text-[var(--text)]">{timelineWindowLabel}</strong>
              <span className="text-xs text-[var(--text-muted)]">{visibleTimelineDays.length} дней в видимом окне</span>
            </div>
            <div className="flex items-center gap-2">
              <IconButton
                aria-label="Показать предыдущие дни"
                className="size-10"
                disabled={!canMoveTimelineBackward}
                onClick={() => shiftTimelineWindow(-1)}
              >
                <AppIcon icon={ChevronLeft} />
              </IconButton>
              <IconButton
                aria-label="Показать следующие дни"
                className="size-10"
                disabled={!canMoveTimelineForward}
                onClick={() => shiftTimelineWindow(1)}
              >
                <AppIcon icon={ChevronRight} />
              </IconButton>
            </div>
          </div>

          <div className="max-h-[min(58vh,720px)] overflow-auto px-5 pb-1 [scrollbar-gutter:stable_both-edges] max-[720px]:px-4">
            <div
              className="grid w-max min-w-[calc(190px+(var(--calendar-columns,31)*40px))] gap-2"
              style={{ ["--calendar-columns" as string]: String(visibleTimelineDays.length) }}
            >
              <div className="sticky top-0 z-[5] grid grid-cols-[190px_minmax(0,1fr)] gap-[14px] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(255_255_255_/_0.94))] pb-1.5">
                <div className="sticky left-0 z-[7] min-h-[54px] border-b border-[var(--border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(255_255_255_/_0.94))]" />

                <div
                  className="grid"
                  style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(38px, 40px))` }}
                >
                  {visibleTimelineDays.map((day) => (
                    <div
                      key={day.key}
                      className="grid min-h-[54px] justify-items-center gap-1 border-b border-[var(--border)] px-0 py-[6px] pb-2.5 text-[11px] lowercase text-[var(--text-muted)]"
                    >
                      <strong
                        className={cn(
                          "text-xs font-semibold text-[var(--text)]",
                          day.isToday &&
                            "grid h-8 w-8 place-items-center rounded-xl border border-[rgb(var(--color-primary-rgb)_/_0.26)] bg-[var(--surface)]",
                        )}
                      >
                        {day.dayLabel}
                      </strong>
                      <span>{day.weekDayLabel}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                {rooms.map((room, rowIndex) => {
                  const ranges = getTimelineBusyRanges(room.busyRanges, visibleTimelineDays);
                  const isSelectedRoom = room.id === selectedRoom?.id;

                  return (
                    <div key={room.id} className="grid grid-cols-[190px_minmax(0,1fr)] items-stretch gap-[14px]">
                      <button
                        type="button"
                        className={cn(
                          "sticky left-0 z-[6] grid min-h-[72px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[20px] border px-4 py-3 text-left shadow-[var(--shadow-sm)]",
                          isSelectedRoom
                            ? "border-[rgb(var(--color-primary-rgb)_/_0.28)] bg-[rgb(var(--color-primary-rgb)_/_0.08)]"
                            : "border-[var(--color-border)] bg-[rgb(255_255_255_/_0.96)]",
                        )}
                        onClick={() => handleRoomFocus(room.id)}
                      >
                        <span
                          className={cn(
                            "grid h-9 w-9 place-items-center rounded-[14px] text-sm font-bold",
                            `bg-[rgb(var(--color-primary-rgb)_/_0.${(rowIndex % 4) + 1}2)]`,
                            "text-[var(--color-primary-hover)]",
                          )}
                        >
                          {rowIndex + 1}
                        </span>
                        <span className="grid min-w-0 gap-0.5">
                          <strong className="truncate text-sm font-semibold text-[var(--text)]">{room.title}</strong>
                          <small className="text-xs text-[var(--text-muted)]">{getRoomSummary(room)}</small>
                        </span>
                      </button>

                      <div className={cn("grid gap-2 rounded-[20px] border px-3 py-3", isSelectedRoom ? "border-[rgb(var(--color-primary-rgb)_/_0.22)] bg-[rgb(var(--color-primary-rgb)_/_0.04)]" : "border-[var(--color-border)] bg-[rgb(255_255_255_/_0.82)]")}>
                        <div
                          className="grid gap-2"
                          style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(38px, 40px))` }}
                        >
                          {visibleTimelineDays.map((day) => {
                            const dayBusyRange =
                              room.busyRanges.find((range) => day.key >= range.startsOn && day.key <= range.endsOn) ?? null;
                            const isSelectionStart = isSelectedRoom && selectionStart === day.key;
                            const isActiveRange = selectedBusyRangeId ? dayBusyRange?.id === selectedBusyRangeId : false;

                            return (
                              <button
                                key={`${room.id}-${day.key}`}
                                type="button"
                                className={cn(
                                  timelineCellClass,
                                  dayBusyRange && "border-[rgb(217_154_43_/_0.18)] bg-[rgb(217_154_43_/_0.18)]",
                                  day.isToday && "border-[rgb(var(--color-primary-rgb)_/_0.22)]",
                                  isSelectionStart && "border-[#7c6fd6] bg-[rgb(124_111_214_/_0.16)]",
                                  isActiveRange && "border-[#3b6ea8] bg-[rgb(59_110_168_/_0.18)]",
                                )}
                                onClick={() => handleTimelineCellClick(room, day.key)}
                                aria-label={`${room.title}: ${formatDateLabel(day.date)}. ${dayBusyRange ? "Занято" : "Свободно"}.`}
                              />
                            );
                          })}
                        </div>

                        <div
                          className="grid gap-2 text-center text-[11px] text-[var(--text-muted)]"
                          style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(38px, 40px))` }}
                        >
                          {visibleTimelineDays.map((day) => (
                            <span key={`${room.id}-price-${day.key}`}>{room.pricePerNight.toLocaleString("ru-RU")}</span>
                          ))}
                        </div>

                        <div
                          className="grid gap-2"
                          style={{ gridTemplateColumns: `repeat(${visibleTimelineDays.length}, minmax(38px, 40px))` }}
                        >
                          {ranges.map((range) => (
                            <button
                              key={range.busyRange.id}
                              type="button"
                              className={cn(
                                "grid gap-1 rounded-2xl border px-2 py-2 text-left text-white shadow-[var(--shadow-sm)]",
                                selectedBusyRangeId === range.busyRange.id
                                  ? "border-[#3b6ea8] bg-[#3b6ea8]"
                                  : "border-[#d99a2b] bg-[#d99a2b]",
                              )}
                              style={{
                                gridColumn: `${range.startIndex + 1} / span ${range.span}`,
                              }}
                              onClick={() => handleOpenBusyRange(room.id, range.busyRange)}
                            >
                              <span className="truncate text-xs font-semibold">
                                {range.clippedStart ? "…" : ""}
                                {getTimelineRangeLabel(range.busyRange)}
                                {range.clippedEnd ? "…" : ""}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] opacity-95">
                                {formatShortDateLabel(range.busyRange.startsOn)} - {formatShortDateLabel(range.busyRange.endsOn)}
                                <AppIcon icon={PencilLine} className="h-3.5 w-3.5" />
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedRoom ? (
        <section className={stackClass}>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Выбранный номер" value={selectedRoom.title} subtitle="Календарь занятости номера" />
            <StatCard title="Базовая цена" value={formatRoomPrice(selectedRoom.pricePerNight)} subtitle="Отображается для каждого дня в шкале" />
            <StatCard
              title="Ближайший период"
              value={
                nearestBusyRange
                  ? `${formatShortDateLabel(nearestBusyRange.startsOn)} - ${formatShortDateLabel(nearestBusyRange.endsOn)}`
                  : "Нет занятых дат"
              }
              subtitle={nearestBusyRange?.label || "Свободные даты"}
            />
          </div>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <section className="grid gap-4 rounded-[22px] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.96)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <strong className="text-base font-semibold text-[var(--text)]">{selectedRoom.title}</strong>
                  <p className="mt-1 text-[13px] leading-[1.5] text-[var(--text-muted)]">Детальный месяц для проверки выбора и занятых дат.</p>
                </div>
                <span className="text-sm font-medium text-[var(--text-muted)]">{formatMonthLabel(currentMonth)}</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-[var(--text-muted)]">
                    {day}
                  </div>
                ))}

                {monthDays.map((day) => {
                  const isSelectionStart = selectionStart === day.key;
                  const isActiveBusyRange = selectedBusyRangeId ? day.busyRange?.id === selectedBusyRangeId : false;

                  return (
                    <button
                      key={day.key}
                      type="button"
                      className={cn(
                        "grid min-h-[72px] gap-1 rounded-[16px] border border-transparent bg-[rgb(248_250_252_/_0.85)] px-2 py-2 text-left transition-[transform,border-color,background-color] duration-[180ms] hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)]",
                        day.busyRange && "border-[rgb(217_154_43_/_0.18)] bg-[rgb(217_154_43_/_0.18)]",
                        !day.inCurrentMonth && "bg-[rgb(248_250_252_/_0.40)] text-[rgb(148_163_184)]",
                        day.isToday && "border-[rgb(var(--color-primary-rgb)_/_0.22)]",
                        isSelectionStart && "border-[#7c6fd6] bg-[rgb(124_111_214_/_0.16)]",
                        isActiveBusyRange && "border-[#3b6ea8] bg-[rgb(59_110_168_/_0.18)]",
                      )}
                      onClick={() => handleTimelineCellClick(selectedRoom, day.key)}
                    >
                      <span className="text-sm font-semibold text-[var(--text)]">{day.date.getDate()}</span>
                      <small className="text-[11px] leading-[1.35] text-[var(--text-muted)]">
                        {day.busyRange?.label || (day.busyRange ? "Занято" : "Свободно")}
                      </small>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4">
              <section className={editorCardClass}>
                <div className="grid gap-1.5">
                  <strong className="text-base font-semibold text-[var(--text)]">Занятые диапазоны</strong>
                  <span className="text-[13px] leading-[1.5] text-[var(--text-muted)]">
                    {selectedRoom.busyRanges.length
                      ? "Откройте диапазон, чтобы изменить даты или комментарий."
                      : "Пока нет занятых дат."}
                  </span>
                </div>
                {selectedRoom.busyRanges.length ? (
                  <div className="grid gap-3">
                    {selectedRoom.busyRanges.map((busyRange) => (
                      <button
                        key={busyRange.id}
                        type="button"
                        className={cn(
                          "grid gap-1 rounded-[18px] border px-4 py-3 text-left transition-[border-color,background-color,transform] duration-[180ms] hover:-translate-y-px",
                          selectedBusyRangeId === busyRange.id
                            ? "border-[rgb(var(--color-primary-rgb)_/_0.28)] bg-[rgb(var(--color-primary-rgb)_/_0.08)]"
                            : "border-[var(--color-border)] bg-[rgb(255_255_255_/_0.92)]",
                        )}
                        onClick={() => handleOpenBusyRange(selectedRoom.id, busyRange)}
                      >
                        <strong className="text-sm font-semibold text-[var(--text)]">
                          {formatDateLabel(busyRange.startsOn)} - {formatDateLabel(busyRange.endsOn)}
                        </strong>
                        <span className="text-sm text-[var(--text-muted)]">{busyRange.label || "Без пометки"}</span>
                        <small className="text-xs text-[var(--text-muted)]">{busyRange.note || "Без комментария"}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-[1.5] text-[var(--text-muted)]">Занятые даты еще не отмечены.</p>
                )}
              </section>

              {renderEditorPanel()}
            </section>
          </section>
        </section>
      ) : null}
    </section>
  );
}
