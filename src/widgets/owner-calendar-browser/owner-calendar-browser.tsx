"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, PencilLine } from "lucide-react";

import type { OwnerBusyRange } from "@/entities/room";
import {
  type CalendarDayCell,
  addDaysToDateKey,
  addMonths,
  findBusyRangeForDate,
  formatMonthLabel,
  formatShortDateLabel,
  getMonthDays,
  hasBusyOverlap,
  normalizeDateRange,
  parseDateKey,
  startOfMonth,
  weekDays,
} from "@/entities/room/model/calendar-helpers";
import { createRoomBusyRange, deleteRoomBusyRange, updateRoomBusyRange } from "@/features/property/owner-mutations";
import { cn } from "@/shared/lib/cn";
import { formatDateLabel } from "@/shared/lib/date";
import { AppIcon, BottomSheet, Button, IconButton, InlineNotice, Input, Select, Textarea } from "@/shared/ui";

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

const monthControlClass = "size-10 rounded-[8px] border-[var(--border)] bg-transparent shadow-none hover:translate-y-0";
const editorActionsClass = "grid gap-2 sm:grid-cols-2";

function formatRoomPrice(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function formatCalendarMonthLabel(value: Date) {
  const label = formatMonthLabel(value);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function formatBusyRangeCount(value: number) {
  const lastTwoDigits = value % 100;
  const lastDigit = value % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${value} диапазонов`;
  }

  if (lastDigit === 1) {
    return `${value} диапазон`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${value} диапазона`;
  }

  return `${value} диапазонов`;
}

function getPanelTitle(activeEditor: ActiveEditorState | null) {
  if (!activeEditor) {
    return "Занятые даты";
  }

  return activeEditor.mode === "create" ? "Новые занятые даты" : "Изменить занятые даты";
}

function getPanelDescription(activeEditor: ActiveEditorState | null, roomTitle: string) {
  if (!activeEditor) {
    return roomTitle;
  }

  return activeEditor.mode === "create"
    ? `${roomTitle}. Проверьте дату заезда и выезда.`
    : `${roomTitle}. Изменения сохранятся в календаре занятости.`;
}

function getSelectionNotice(selectionStart: string | null) {
  return selectionStart
    ? `Заезд: ${formatDateLabel(selectionStart)}. Выберите дату выезда.`
    : "Выберите дату заезда, затем дату выезда. День выезда остаётся свободным.";
}

function getBusyBandEdges(monthDays: CalendarDayCell<OwnerBusyRange>[], index: number) {
  const currentRangeId = monthDays[index]?.busyRange?.id;
  const previousRangeId = monthDays[index - 1]?.busyRange?.id;
  const nextRangeId = monthDays[index + 1]?.busyRange?.id;

  return {
    continuesFromPrevious: index % 7 !== 0 && Boolean(currentRangeId && currentRangeId === previousRangeId),
    continuesToNext: index % 7 !== 6 && Boolean(currentRangeId && currentRangeId === nextRangeId),
  };
}

export function OwnerCalendarBrowser({
  propertyId = "",
  rooms,
  serverNotice = "",
  serverNoticeTone = "default",
}: OwnerCalendarBrowserProps) {
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id ?? "");
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<ActiveEditorState | null>(null);
  const [localNotice, setLocalNotice] = useState("");

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0] ?? null,
    [rooms, selectedRoomId],
  );
  const monthDays = useMemo(
    () => (selectedRoom ? getMonthDays(currentMonth, selectedRoom.busyRanges) : []),
    [currentMonth, selectedRoom],
  );
  const selectedBusyRangeId = activeEditor?.mode === "edit" ? activeEditor.busyRange.id : null;

  function handleRoomChange(roomId: string) {
    setSelectedRoomId(roomId);
    setSelectionStart(null);
    setActiveEditor(null);
    setLocalNotice("");
  }

  function handleDayClick(dayKey: string) {
    if (!selectedRoom) {
      return;
    }

    setLocalNotice("");
    const dayBusyRange = findBusyRangeForDate(selectedRoom.busyRanges, dayKey);

    if (dayBusyRange) {
      setSelectionStart(null);
      setActiveEditor({ mode: "edit", roomId: selectedRoom.id, busyRange: dayBusyRange });
      return;
    }

    if (!selectionStart) {
      setSelectionStart(dayKey);
      setActiveEditor(null);
      return;
    }

    const nextRange = selectionStart === dayKey
      ? { startsOn: dayKey, endsOn: addDaysToDateKey(dayKey, 1) }
      : normalizeDateRange(selectionStart, dayKey);

    if (hasBusyOverlap(selectedRoom.busyRanges, nextRange.startsOn, nextRange.endsOn)) {
      setSelectionStart(null);
      setLocalNotice("Выбранный диапазон пересекается с уже отмеченными занятыми датами.");
      return;
    }

    setSelectionStart(null);
    setActiveEditor({
      mode: "create",
      roomId: selectedRoom.id,
      startsOn: nextRange.startsOn,
      endsOn: nextRange.endsOn,
    });
  }

  function handleOpenBusyRange(busyRange: OwnerBusyRange) {
    setSelectionStart(null);
    setActiveEditor({ mode: "edit", roomId: selectedRoom.id, busyRange });
    setCurrentMonth(startOfMonth(parseDateKey(busyRange.startsOn)));
    setLocalNotice("");
  }

  function updateMonth(nextMonth: Date) {
    setCurrentMonth(nextMonth);
    setSelectionStart(null);
    setLocalNotice("");
  }

  function renderEditorForm() {
    if (!activeEditor) {
      return null;
    }

    if (activeEditor.mode === "create") {
      return (
        <form action={createRoomBusyRange} className="grid gap-4">
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="roomId" value={activeEditor.roomId} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="owner-busy-new-start" name="startsOn" type="date" label="Заезд" defaultValue={activeEditor.startsOn} required />
            <Input id="owner-busy-new-end" name="endsOn" type="date" label="Выезд" defaultValue={activeEditor.endsOn} required />
          </div>
          <Input id="owner-busy-new-label" name="label" label="Пометка" placeholder="Например, заявка" />
          <Textarea id="owner-busy-new-note" name="note" label="Комментарий" rows={4} />
          <p className="border-y border-[var(--border)] py-3 text-xs leading-[1.5] text-[var(--text-muted)]">
            Дата выезда не занимает ночь и доступна для следующего заезда.
          </p>
          <div className={editorActionsClass}>
            <Button type="button" variant="secondary" onClick={() => setActiveEditor(null)}>Отменить</Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      );
    }

    return (
      <form action={updateRoomBusyRange} className="grid gap-4">
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="busyRangeId" value={activeEditor.busyRange.id} />
        <div className="grid grid-cols-2 gap-3">
          <Input id={`owner-busy-edit-start-${activeEditor.busyRange.id}`} name="startsOn" type="date" label="Заезд" defaultValue={activeEditor.busyRange.startsOn} required />
          <Input id={`owner-busy-edit-end-${activeEditor.busyRange.id}`} name="endsOn" type="date" label="Выезд" defaultValue={activeEditor.busyRange.endsOn} required />
        </div>
        <Input id={`owner-busy-edit-label-${activeEditor.busyRange.id}`} name="label" label="Пометка" defaultValue={activeEditor.busyRange.label} />
        <Textarea id={`owner-busy-edit-note-${activeEditor.busyRange.id}`} name="note" label="Комментарий" rows={4} defaultValue={activeEditor.busyRange.note} />
        <p className="border-y border-[var(--border)] py-3 text-xs leading-[1.5] text-[var(--text-muted)]">
          Дата выезда не занимает ночь и доступна для следующего заезда.
        </p>
        <div className={editorActionsClass}>
          <Button type="submit" variant="danger" formAction={deleteRoomBusyRange}>Удалить диапазон</Button>
          <Button type="submit">Сохранить</Button>
        </div>
      </form>
    );
  }

  if (!selectedRoom) {
    return null;
  }

  return (
    <section className="grid min-w-0 gap-6">
      {(serverNotice || localNotice) ? <InlineNotice tone={localNotice ? "error" : serverNoticeTone}>{serverNotice || localNotice}</InlineNotice> : null}

      <section className="min-w-0 overflow-hidden border-y border-[var(--border)] bg-[var(--surface)]" aria-label="Календарь занятости">
        <header className="grid min-w-0 gap-4 border-b border-[var(--border)] px-5 py-4 lg:grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)] lg:items-center max-[720px]:px-3">
          <div className="min-w-0">
            {rooms.length > 1 ? (
              <Select
                id="owner-calendar-room"
                aria-label="Выбрать номер"
                value={selectedRoom.id}
                onChange={(event) => handleRoomChange(event.target.value)}
                className="max-w-[320px] rounded-[8px] bg-transparent font-semibold"
                options={rooms.map((room) => ({ value: room.id, label: room.title }))}
              />
            ) : (
              <div className="grid gap-0.5">
                <strong className="truncate text-base font-semibold text-[var(--text)]">{selectedRoom.title}</strong>
                <span className="text-xs text-[var(--text-muted)]">Номер</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 max-[720px]:justify-between">
            <IconButton aria-label="Предыдущий месяц" className={monthControlClass} onClick={() => updateMonth(addMonths(currentMonth, -1))}>
              <AppIcon icon={ChevronLeft} />
            </IconButton>
            <strong className="min-w-[156px] text-center text-lg font-semibold text-[var(--text)] max-[420px]:min-w-0">
              {formatCalendarMonthLabel(currentMonth)}
            </strong>
            <IconButton aria-label="Следующий месяц" className={monthControlClass} onClick={() => updateMonth(addMonths(currentMonth, 1))}>
              <AppIcon icon={ChevronRight} />
            </IconButton>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] max-[720px]:justify-start">
            <span><strong className="font-semibold text-[var(--text)]">{formatRoomPrice(selectedRoom.pricePerNight)}</strong> за ночь</span>
            <span>{formatBusyRangeCount(selectedRoom.busyRanges.length)}</span>
            <button type="button" className="bg-transparent p-0 font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline" onClick={() => updateMonth(startOfMonth(new Date()))}>
              Сегодня
            </button>
          </div>
        </header>

        <div className="grid grid-cols-7 border-l border-[var(--border)] bg-[var(--surface-subtle)]" aria-hidden="true">
          {weekDays.map((day, index) => (
            <div key={day} className={cn("border-b border-r border-[var(--border)] py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]", index > 4 && "text-[var(--accent-strong)]")}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-l border-[var(--border)]">
          {monthDays.map((day, index) => {
            const isSelectionStart = selectionStart === day.key;
            const isActiveBusyRange = selectedBusyRangeId ? day.busyRange?.id === selectedBusyRangeId : false;
            const { continuesFromPrevious, continuesToNext } = getBusyBandEdges(monthDays, index);
            const showBusyLabel = Boolean(day.busyRange && !continuesFromPrevious);

            return (
              <button
                key={day.key}
                type="button"
                className={cn(
                  "group relative min-h-[104px] border-b border-r border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-left transition-colors hover:bg-[var(--surface-subtle)] focus-visible:z-[3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] max-[720px]:min-h-[72px] max-[720px]:px-1.5 max-[720px]:py-1.5",
                  !day.inCurrentMonth && "bg-[rgb(248_246_241_/_0.54)] text-[var(--text-subtle)]",
                  isSelectionStart && "z-[2] bg-[rgb(var(--color-primary-rgb)_/_0.10)] ring-2 ring-inset ring-[var(--accent)]",
                )}
                onClick={() => handleDayClick(day.key)}
                aria-label={`${selectedRoom.title}: ${formatDateLabel(day.date)}. ${day.busyRange ? `Занято: ${day.busyRange.label || "без пометки"}` : "Свободно"}. Цена ${formatRoomPrice(selectedRoom.pricePerNight)} за ночь.`}
              >
                <span className={cn("relative z-[2] inline-grid size-7 place-items-center text-sm font-semibold text-[var(--text)] max-[720px]:size-6 max-[720px]:text-xs", day.isToday && "rounded-full bg-[var(--accent)] text-white", !day.inCurrentMonth && !day.isToday && "text-[var(--text-subtle)]")}>
                  {day.date.getDate()}
                </span>

                {day.busyRange ? (
                  <span className={cn("absolute inset-x-0 top-[46px] z-[1] flex h-7 items-center bg-[#d99a2b] px-2 text-[11px] font-semibold text-[#20211f] max-[720px]:top-[34px] max-[720px]:h-6 max-[720px]:px-1", !continuesFromPrevious && "left-1 rounded-l-[6px]", !continuesToNext && "right-1 rounded-r-[6px]", isActiveBusyRange && "bg-[#3b6ea8] text-white")}>
                    {showBusyLabel ? <span className="truncate">{day.busyRange.label || "Занято"}</span> : null}
                  </span>
                ) : null}

                <span className="absolute bottom-2 left-2 text-[11px] text-[var(--text-muted)] max-[720px]:bottom-1.5 max-[720px]:left-1.5 max-[720px]:text-[9px]">
                  {selectedRoom.pricePerNight.toLocaleString("ru-RU")}
                </span>
              </button>
            );
          })}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--text-muted)] max-[720px]:px-3">
          <span>{getSelectionNotice(selectionStart)}</span>
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Обозначения календаря">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 bg-[#d99a2b]" aria-hidden="true" />Занято</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />Сегодня</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 border-2 border-[var(--accent)]" aria-hidden="true" />Заезд выбран</span>
          </span>
        </footer>
      </section>

      <section className="border-t border-[var(--border)]" aria-labelledby="owner-busy-ranges-title">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] py-4">
          <div className="grid gap-1">
            <h3 id="owner-busy-ranges-title" className="text-lg font-semibold text-[var(--text)]">Занятые диапазоны</h3>
            <p className="text-sm text-[var(--text-muted)]">Нажмите строку, чтобы изменить даты или комментарий.</p>
          </div>
          <span className="text-sm font-semibold text-[var(--text-muted)]">{selectedRoom.busyRanges.length}</span>
        </div>

        {selectedRoom.busyRanges.length ? (
          <div className="divide-y divide-[var(--border)]">
            {selectedRoom.busyRanges.map((busyRange) => (
              <button
                key={busyRange.id}
                type="button"
                className={cn("grid w-full grid-cols-[minmax(200px,0.9fr)_minmax(140px,0.65fr)_minmax(180px,1fr)_auto] items-center gap-4 px-1 py-3.5 text-left transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] max-[720px]:grid-cols-[minmax(0,1fr)_auto] max-[720px]:gap-x-3 max-[720px]:gap-y-1.5", selectedBusyRangeId === busyRange.id && "bg-[rgb(var(--color-primary-rgb)_/_0.08)]")}
                onClick={() => handleOpenBusyRange(busyRange)}
              >
                <strong className="text-sm font-semibold text-[var(--text)]">{formatShortDateLabel(busyRange.startsOn)} — {formatShortDateLabel(busyRange.endsOn)}</strong>
                <span className="truncate text-sm text-[var(--text)] max-[720px]:col-start-1">{busyRange.label || "Без пометки"}</span>
                <span className="truncate text-sm text-[var(--text-muted)] max-[720px]:col-span-2">{busyRange.note || "Без комментария"}</span>
                <AppIcon icon={PencilLine} className="h-4 w-4 text-[var(--text-muted)] max-[720px]:col-start-2 max-[720px]:row-start-1" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : (
          <p className="border-b border-[var(--border)] py-5 text-sm text-[var(--text-muted)]">Занятые даты ещё не отмечены.</p>
        )}
      </section>

      <BottomSheet
        open={Boolean(activeEditor)}
        onOpenChange={(open) => { if (!open) setActiveEditor(null); }}
        title={getPanelTitle(activeEditor)}
        description={getPanelDescription(activeEditor, selectedRoom.title)}
        closeLabel="Закрыть редактор"
        desktopSidePanel
        rootClassName="md:items-stretch md:justify-end md:pt-0"
        className="max-[640px]:max-h-[94vh] md:mt-0 md:h-full md:max-h-none md:max-w-[460px] md:rounded-none md:rounded-l-[24px]"
        bodyClassName="gap-4"
      >
        {renderEditorForm()}
      </BottomSheet>
    </section>
  );
}
