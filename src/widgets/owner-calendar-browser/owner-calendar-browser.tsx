"use client";

import { useMemo, useState } from "react";

import { createRoomBusyRange, deleteRoomBusyRange, updateRoomBusyRange } from "@/app/dashboard/properties/actions";
import type { OwnerBusyRange } from "@/entities/room";
import { formatDateLabel } from "@/shared/lib/date";
import { Button, Input, Select, StatCard, Tabs, Textarea } from "@/shared/ui";
import {
  addMonths,
  formatMonthLabel,
  formatShortDateLabel,
  getMonthDays,
  getNearestBusyRange,
  getOverviewDays,
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

type CalendarMode = "overview" | "month";

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
    return "Выберите свободные даты в календаре или откройте существующий диапазон.";
  }

  if (activeEditor.mode === "create") {
    return "Проверьте даты и при необходимости добавьте пометку или комментарий.";
  }

  return "Обновите даты, пометку или комментарий для выбранного диапазона.";
}

export function OwnerCalendarBrowser({ propertyId = "", rooms, serverNotice = "" }: OwnerCalendarBrowserProps) {
  const [mode, setMode] = useState<CalendarMode>("overview");
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

  function openRoomMonth(roomId: string) {
    setSelectedRoomId(roomId);
    setMode("month");
    resetInteractionState();
  }

  function handleRoomChange(roomId: string) {
    setSelectedRoomId(roomId);
    resetInteractionState();
  }

  function handleCalendarDayClick(dayKey: string, busyRange: OwnerBusyRange | null) {
    if (!selectedRoom) {
      return;
    }

    setLocalNotice("");

    if (busyRange) {
      setSelectionStart(null);
      setActiveEditor({
        mode: "edit",
        roomId: selectedRoom.id,
        busyRange,
      });
      return;
    }

    if (!selectionStart) {
      setSelectionStart(dayKey);
      setActiveEditor(null);
      return;
    }

    const nextRange = normalizeDateRange(selectionStart, dayKey);

    if (hasBusyOverlap(selectedRoom.busyRanges, nextRange.startsOn, nextRange.endsOn)) {
      setSelectionStart(null);
      setActiveEditor(null);
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
    if (!selectedRoom) {
      return;
    }

    setMode("month");
    setSelectionStart(null);
    setActiveEditor({
      mode: "edit",
      roomId: selectedRoom.id,
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
            <strong>Отмечайте свободные даты прямо в месяце</strong>
            <p>Первый клик выбирает начало диапазона, второй клик завершает его.</p>
            <p>Клик по занятой дате открывает существующий диапазон для редактирования.</p>
            {selectionStart ? <p>Начало диапазона выбрано: {formatDateLabel(selectionStart)}.</p> : null}
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
            <Input id="owner-busy-new-label" name="label" label="Пометка" placeholder="Например, занято" />
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
          <Input id={`owner-busy-edit-start-${activeEditor.busyRange.id}`} name="startsOn" type="date" label="С" defaultValue={activeEditor.busyRange.startsOn} />
          <Input id={`owner-busy-edit-end-${activeEditor.busyRange.id}`} name="endsOn" type="date" label="По" defaultValue={activeEditor.busyRange.endsOn} />
          <Input id={`owner-busy-edit-label-${activeEditor.busyRange.id}`} name="label" label="Пометка" defaultValue={activeEditor.busyRange.label} />
          <Textarea id={`owner-busy-edit-note-${activeEditor.busyRange.id}`} name="note" label="Комментарий" rows={3} defaultValue={activeEditor.busyRange.note} />
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

      <section className="br-owner-calendar-flow">
        <section className="br-owner-calendar-controls br-card">
          <div className="br-owner-calendar-controls__top">
            <div>
              <h3>Номер</h3>
              <p>{selectedRoom?.subtitle || "Отмечайте занятые даты вручную без автоматического подтверждения заявок."}</p>
            </div>
            <Select
              value={selectedRoom?.id ?? ""}
              onChange={(event) => handleRoomChange(event.target.value)}
              options={rooms.map((room) => ({ value: room.id, label: room.title }))}
            />
          </div>

          <div className="br-owner-calendar-controls__toolbar">
            <Tabs
              ariaLabel="Режим календаря занятости"
              items={[
                { value: "overview", label: "Обзор" },
                { value: "month", label: "Месяц" },
              ]}
              value={mode}
              onChange={(value) => setMode(value as CalendarMode)}
            />
            <div className="br-calendar-toolbar">
              <Button variant="secondary" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                Назад
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const today = new Date();
                  setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                }}
              >
                Сегодня
              </Button>
              <Button variant="secondary" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                Вперёд
              </Button>
            </div>
          </div>

          {selectedRoom ? (
            <div className="br-owner-calendar-stats">
              <StatCard title="Базовая цена" value={formatRoomPrice(selectedRoom.pricePerNight)} subtitle={selectedRoom.title} />
              <StatCard
                title="Занятые диапазоны"
                value={String(selectedRoom.busyRanges.length)}
                subtitle={nearestBusyRange ? `Ближайший: ${formatDateLabel(nearestBusyRange.startsOn)}` : "Занятые даты пока не отмечены"}
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
          ) : null}
        </section>

        <section className="br-dashboard-block br-card">
          <div className="br-owner-calendar-monthbar">
            <strong>{formatMonthLabel(currentMonth)}</strong>
            <span>{selectedRoom ? `Номер: ${selectedRoom.title}` : "Выберите номер для просмотра занятых дат."}</span>
          </div>

          {mode === "overview" ? (
            <div className="br-owner-calendar-overview">
              {rooms.map((room) => {
                const overviewDays = getOverviewDays(room.busyRanges);
                const roomNearestBusyRange = getNearestBusyRange(room.busyRanges);

                return (
                  <article key={room.id} className="br-owner-calendar-overview__row">
                    <div className="br-owner-calendar-overview__meta">
                      <div>
                        <strong>{room.title}</strong>
                        <p>Базовая цена: {formatRoomPrice(room.pricePerNight)} • Занятых диапазонов: {room.busyRanges.length}</p>
                      </div>
                      <Button variant="secondary" onClick={() => openRoomMonth(room.id)}>
                        Открыть месяц
                      </Button>
                    </div>
                    <div className="br-owner-calendar-strip__viewport">
                      <div className="br-owner-calendar-strip" aria-label={`Обзор занятости номера ${room.title}`}>
                        {overviewDays.map((day) => (
                          <div
                            key={`${room.id}-${day.key}`}
                            className={`br-owner-calendar-strip__day${day.busyRange ? " br-owner-calendar-strip__day--busy" : ""}${day.isToday ? " br-owner-calendar-strip__day--today" : ""}`}
                            title={day.busyRange ? `${day.key}: ${day.busyRange.label || "Занято"}` : `${day.key}: свободно`}
                          >
                            <span>{day.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="br-owner-muted">
                      {roomNearestBusyRange
                        ? `Ближайший занятый период: ${formatDateLabel(roomNearestBusyRange.startsOn)} - ${formatDateLabel(roomNearestBusyRange.endsOn)}`
                        : "Ближайшие 31 день без занятых дат."}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : selectedRoom ? (
            <div className="br-owner-calendar-month">
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
                      onClick={() => handleCalendarDayClick(day.key, day.busyRange)}
                    >
                      <span className="br-owner-calendar-day__date">{day.date.getDate()}</span>
                      <small>{day.busyRange?.label || (day.busyRange ? "Занято" : "Свободно")}</small>
                    </button>
                  );
                })}
              </div>

              <div className="br-owner-calendar-history">
                <div className="br-owner-calendar-history__header">
                  <strong>Занятые диапазоны номера</strong>
                  <span>{selectedRoom.busyRanges.length ? "Клик по диапазону открывает его ниже для редактирования." : "Пока нет занятых дат."}</span>
                </div>
                {selectedRoom.busyRanges.length ? (
                  <div className="br-owner-calendar-history__list">
                    {selectedRoom.busyRanges.map((busyRange) => (
                      <button
                        key={busyRange.id}
                        type="button"
                        className={`br-owner-calendar-history__item${selectedBusyRangeId === busyRange.id ? " br-owner-calendar-history__item--active" : ""}`}
                        onClick={() => handleOpenBusyRange(busyRange)}
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
              </div>
            </div>
          ) : (
            <div className="br-empty-state">
              <strong>Сначала добавьте номер</strong>
              <p>После добавления номера здесь появится календарь занятости и обзор по занятым датам.</p>
            </div>
          )}
        </section>

        {mode === "month" && selectedRoom ? renderEditorPanel() : null}
      </section>
    </section>
  );
}
