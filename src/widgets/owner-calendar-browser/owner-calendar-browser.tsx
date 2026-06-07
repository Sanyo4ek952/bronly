"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Dot, PencilLine } from "lucide-react";

import { createRoomBusyRange, deleteRoomBusyRange, updateRoomBusyRange } from "@/app/dashboard/properties/actions";
import type { OwnerBusyRange } from "@/entities/room";
import { formatDateLabel } from "@/shared/lib/date";
import { AppIcon, Button, IconButton, Input, StatCard, Textarea } from "@/shared/ui";
import {
  addMonths,
  formatMonthLabel,
  formatMonthRangeLabel,
  formatShortDateLabel,
  getMonthDays,
  getNearestBusyRange,
  getTimelineBusyRanges,
  getTimelineDays,
  hasBusyOverlap,
  normalizeDateRange,
  parseDateKey,
  weekDays,
} from "@/widgets/calendar/lib/calendar-helpers";

type OwnerCalendarRoom = {
  id: string;
  title: string;
  subtitle: string;
  pricePerNight: number;
  busyRanges: OwnerBusyRange[];
};

type OwnerCalendarBrowserProps = {
  propertyId?: string;
  rooms: OwnerCalendarRoom[];
  serverNotice?: string;
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
  return selectionStart ? `Начало диапазона выбрано: ${formatDateLabel(selectionStart)}.` : "Кликните по двум датам, чтобы отметить занятый диапазон.";
}

export function OwnerCalendarBrowser({ propertyId = "", rooms, serverNotice = "" }: OwnerCalendarBrowserProps) {
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id ?? "");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
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
  const timelineDays = useMemo(() => getTimelineDays(currentMonth), [currentMonth]);
  const nearestBusyRange = useMemo(
    () => (selectedRoom ? getNearestBusyRange(selectedRoom.busyRanges) : null),
    [selectedRoom],
  );
  const selectedBusyRangeId = activeEditor?.mode === "edit" ? activeEditor.busyRange.id : null;

  function resetInteractionState() {
    setSelectionStart(null);
    setActiveEditor(null);
    setLocalNotice("");
  }

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
    setLocalNotice("");
  }

  function renderEditorPanel() {
    if (!selectedRoom) {
      return null;
    }

    if (!activeEditor) {
      return (
        <section className="br-owner-calendar-editor br-card">
          <div className="br-owner-calendar-editor__header">
            <div>
              <strong>{getPanelTitle(activeEditor)}</strong>
              <p>{getPanelDescription(activeEditor)}</p>
            </div>
          </div>
          <div className="br-owner-calendar-editor__empty">
            <strong>Отмечайте занятые даты прямо в сетке</strong>
            <p>{getSelectionNotice(selectionStart)}</p>
            <p>Клик по занятому диапазону откроет его для редактирования.</p>
          </div>
        </section>
      );
    }

    if (activeEditor.mode === "create") {
      return (
        <form action={createRoomBusyRange} className="br-owner-calendar-editor br-card">
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="roomId" value={activeEditor.roomId} />
          <div className="br-owner-calendar-editor__header">
            <div>
              <strong>{getPanelTitle(activeEditor)}</strong>
              <p>{getPanelDescription(activeEditor)}</p>
            </div>
            <button type="button" className="br-link-button" onClick={() => setActiveEditor(null)}>
              Отменить
            </button>
          </div>
          <div className="br-owner-calendar-editor__body">
            <Input id="owner-busy-new-start" name="startsOn" type="date" label="С" defaultValue={activeEditor.startsOn} />
            <Input id="owner-busy-new-end" name="endsOn" type="date" label="По" defaultValue={activeEditor.endsOn} />
            <Input id="owner-busy-new-label" name="label" label="Пометка" placeholder="Например, заявка" />
            <Textarea id="owner-busy-new-note" name="note" label="Комментарий" rows={3} />
          </div>
          <div className="br-owner-calendar-editor__actions">
            <Button type="button" variant="secondary" onClick={() => setActiveEditor(null)}>
              Отменить
            </Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      );
    }

    return (
      <form action={updateRoomBusyRange} className="br-owner-calendar-editor br-card">
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="busyRangeId" value={activeEditor.busyRange.id} />
        <div className="br-owner-calendar-editor__header">
          <div>
            <strong>{getPanelTitle(activeEditor)}</strong>
            <p>{getPanelDescription(activeEditor)}</p>
          </div>
          <button type="button" className="br-link-button" onClick={() => setActiveEditor(null)}>
            Отменить
          </button>
        </div>
        <div className="br-owner-calendar-editor__body">
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
          />
          <Textarea
            id={`owner-busy-edit-note-${activeEditor.busyRange.id}`}
            name="note"
            label="Комментарий"
            rows={3}
            defaultValue={activeEditor.busyRange.note}
          />
        </div>
        <div className="br-owner-calendar-editor__actions">
          <Button type="submit" variant="danger" formAction={deleteRoomBusyRange}>
            Удалить
          </Button>
          <Button type="submit">Сохранить</Button>
        </div>
      </form>
    );
  }

  return (
    <section className="br-owner-stack">
      {(serverNotice || localNotice) ? <div className="br-inline-notice">{serverNotice || localNotice}</div> : null}

      <section className="br-calendar-shell br-card">
        <div className="br-calendar-shell__header">
          <div className="br-calendar-shell__heading">
            <div className="br-calendar-shell__icon">
              <AppIcon icon={CalendarDays} />
            </div>
            <div>
              <h3>Календарь занятости</h3>
              <p>{formatMonthRangeLabel(currentMonth)}</p>
            </div>
          </div>

          <div className="br-calendar-shell__actions">
            <IconButton
              aria-label="Предыдущий месяц"
              className="br-calendar-shell__nav"
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            >
              <AppIcon icon={ChevronLeft} />
            </IconButton>
            <Button
              variant="secondary"
              className="br-calendar-shell__today"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              }}
            >
              Текущий месяц
            </Button>
            <IconButton
              aria-label="Следующий месяц"
              className="br-calendar-shell__nav"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <AppIcon icon={ChevronRight} />
            </IconButton>
          </div>
        </div>

        <div className="br-calendar-shell__legend">
          <span><Dot />Свободно</span>
          <span><Dot />Занятые даты</span>
          <span><Dot />Сегодня</span>
          <span><Dot />Выбранное начало</span>
          <span><Dot />Активный диапазон</span>
        </div>

        <div className="br-calendar-timeline">
          <div className="br-calendar-timeline__scroll">
            <div
              className="br-calendar-timeline__grid"
              style={{ ["--calendar-columns" as string]: String(timelineDays.length) }}
            >
              <div className="br-calendar-timeline__spacer" />

              {timelineDays.map((day) => (
                <div
                  key={day.key}
                  className={`br-calendar-timeline__head${day.isToday ? " br-calendar-timeline__head--today" : ""}`}
                >
                  <strong>{day.dayLabel}</strong>
                  <span>{day.weekDayLabel}</span>
                </div>
              ))}

              {rooms.map((room, rowIndex) => {
                const ranges = getTimelineBusyRanges(room.busyRanges, timelineDays);
                const isSelectedRoom = room.id === selectedRoom?.id;

                return (
                  <div key={room.id} className="br-calendar-timeline__row">
                    <button
                      type="button"
                      className={`br-calendar-room-card${isSelectedRoom ? " br-calendar-room-card--active" : ""}`}
                      onClick={() => handleRoomFocus(room.id)}
                    >
                      <span className={`br-calendar-room-card__badge br-calendar-room-card__badge--${(rowIndex % 4) + 1}`}>
                        {rowIndex + 1}
                      </span>
                      <span className="br-calendar-room-card__copy">
                        <strong>{room.title}</strong>
                        <small>{room.subtitle || getRoomSummary(room)}</small>
                      </span>
                    </button>

                    <div className={`br-calendar-room-grid${isSelectedRoom ? " br-calendar-room-grid--active" : ""}`}>
                      <div className="br-calendar-room-grid__cells">
                        {timelineDays.map((day) => {
                          const dayBusyRange =
                            room.busyRanges.find((range) => day.key >= range.startsOn && day.key <= range.endsOn) ?? null;
                          const isSelectionStart = isSelectedRoom && selectionStart === day.key;
                          const isActiveRange = selectedBusyRangeId ? dayBusyRange?.id === selectedBusyRangeId : false;

                          return (
                            <button
                              key={`${room.id}-${day.key}`}
                              type="button"
                              className={`br-calendar-room-grid__cell${dayBusyRange ? " br-calendar-room-grid__cell--busy" : ""}${day.isToday ? " br-calendar-room-grid__cell--today" : ""}${isSelectionStart ? " br-calendar-room-grid__cell--selected" : ""}${isActiveRange ? " br-calendar-room-grid__cell--active" : ""}`}
                              onClick={() => handleTimelineCellClick(room, day.key)}
                              aria-label={`${room.title}: ${formatDateLabel(day.date)}. ${dayBusyRange ? "Занято" : "Свободно"}.`}
                            />
                          );
                        })}
                      </div>

                      <div className="br-calendar-room-grid__prices">
                        {timelineDays.map((day) => (
                          <span key={`${room.id}-price-${day.key}`}>{room.pricePerNight.toLocaleString("ru-RU")}</span>
                        ))}
                      </div>

                      <div className="br-calendar-room-grid__ranges">
                        {ranges.map((range) => (
                          <button
                            key={range.busyRange.id}
                            type="button"
                            className={`br-calendar-range-card${selectedBusyRangeId === range.busyRange.id ? " br-calendar-range-card--active" : ""}`}
                            style={{
                              gridColumn: `${range.startIndex + 1} / span ${range.span}`,
                            }}
                            onClick={() => handleOpenBusyRange(room.id, range.busyRange)}
                          >
                            <span className="br-calendar-range-card__label">
                              {range.clippedStart ? "…" : ""}
                              {getTimelineRangeLabel(range.busyRange)}
                              {range.clippedEnd ? "…" : ""}
                            </span>
                            <span className="br-calendar-range-card__meta">
                              {formatShortDateLabel(range.busyRange.startsOn)} - {formatShortDateLabel(range.busyRange.endsOn)}
                              <AppIcon icon={PencilLine} />
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
      </section>

      {selectedRoom ? (
        <section className="br-owner-calendar-detail">
          <div className="br-owner-calendar-stats">
            <StatCard title="Выбранный номер" value={selectedRoom.title} subtitle={selectedRoom.subtitle || "Календарь занятости номера"} />
            <StatCard
              title="Базовая цена"
              value={formatRoomPrice(selectedRoom.pricePerNight)}
              subtitle="Отображается для каждого дня в шкале"
            />
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

          <section className="br-owner-calendar-detail__grid">
            <section className="br-owner-calendar-month br-card">
              <div className="br-owner-calendar-month__header">
                <div>
                  <strong>{selectedRoom.title}</strong>
                  <p>Детальный месяц для проверки выбора и занятых дат.</p>
                </div>
                <span>{formatMonthLabel(currentMonth)}</span>
              </div>

              <div className="br-calendar-grid">
                {weekDays.map((day) => (
                  <div key={day} className="br-calendar-grid__head">
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
                      className={`br-calendar-day br-owner-calendar-day${day.busyRange ? " br-calendar-day--busy" : ""}${!day.inCurrentMonth ? " br-calendar-day--outside" : ""}${day.isToday ? " br-calendar-day--today" : ""}${isSelectionStart ? " br-owner-calendar-day--selected" : ""}${isActiveBusyRange ? " br-owner-calendar-day--active" : ""}`}
                      onClick={() => handleTimelineCellClick(selectedRoom, day.key)}
                    >
                      <span className="br-owner-calendar-day__date">{day.date.getDate()}</span>
                      <small>{day.busyRange?.label || (day.busyRange ? "Занято" : "Свободно")}</small>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="br-owner-calendar-side">
              <section className="br-owner-calendar-history br-card">
                <div className="br-owner-calendar-history__header">
                  <div>
                    <strong>Занятые диапазоны</strong>
                    <span>
                      {selectedRoom.busyRanges.length
                        ? "Откройте диапазон, чтобы изменить даты или комментарий."
                        : "Пока нет занятых дат."}
                    </span>
                  </div>
                </div>
                {selectedRoom.busyRanges.length ? (
                  <div className="br-owner-calendar-history__list">
                    {selectedRoom.busyRanges.map((busyRange) => (
                      <button
                        key={busyRange.id}
                        type="button"
                        className={`br-owner-calendar-history__item${selectedBusyRangeId === busyRange.id ? " br-owner-calendar-history__item--active" : ""}`}
                        onClick={() => handleOpenBusyRange(selectedRoom.id, busyRange)}
                      >
                        <strong>
                          {formatDateLabel(busyRange.startsOn)} - {formatDateLabel(busyRange.endsOn)}
                        </strong>
                        <span>{busyRange.label || "Без пометки"}</span>
                        <small>{busyRange.note || "Без комментария"}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="br-owner-muted">Занятые даты еще не отмечены.</p>
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
