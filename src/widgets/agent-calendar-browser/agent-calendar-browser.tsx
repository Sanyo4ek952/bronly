"use client";

import { useMemo, useState } from "react";

import type { AgentCalendarPropertyItem } from "@/entities/collaboration";
import { formatDateLabel } from "@/shared/lib/date";
import { Button, Select, StatCard, Tabs } from "@/shared/ui";
import {
  addMonths,
  formatMonthLabel,
  formatShortDateLabel,
  getMonthDays,
  getNearestBusyRange,
  getOverviewDays,
  weekDays,
} from "@/widgets/calendar/lib/calendar-helpers";

type CalendarMode = "overview" | "month";

export function AgentCalendarBrowser({ properties }: { properties: AgentCalendarPropertyItem[] }) {
  const [mode, setMode] = useState<CalendarMode>("overview");
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id ?? "");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? properties[0] ?? null,
    [properties, selectedPropertyId],
  );
  const [selectedRoomId, setSelectedRoomId] = useState(selectedProperty?.rooms[0]?.id ?? "");
  const selectedRoom = selectedProperty?.rooms.find((room) => room.id === selectedRoomId) ?? selectedProperty?.rooms[0] ?? null;
  const monthDays = useMemo(
    () => (selectedRoom ? getMonthDays(currentMonth, selectedRoom.busyRanges) : []),
    [currentMonth, selectedRoom],
  );
  const nearestBusyRange = useMemo(
    () => (selectedRoom ? getNearestBusyRange(selectedRoom.busyRanges) : null),
    [selectedRoom],
  );

  function handlePropertyChange(propertyId: string) {
    setSelectedPropertyId(propertyId);
    const nextProperty = properties.find((property) => property.id === propertyId) ?? null;
    setSelectedRoomId(nextProperty?.rooms[0]?.id ?? "");
  }

  function openRoomMonth(roomId: string) {
    setSelectedRoomId(roomId);
    setMode("month");
  }

  return (
    <section className="br-owner-calendar-flow">
      <section className="br-owner-calendar-controls br-card">
        <div className="br-owner-calendar-controls__top">
          <div>
            <h3>Подключенный объект</h3>
            <p>{selectedRoom?.subtitle || "Календарь занятости доступен только для чтения."}</p>
          </div>
          <div className="br-owner-calendar-controls__selectors">
            <Select
              value={selectedProperty?.id ?? ""}
              onChange={(event) => handlePropertyChange(event.target.value)}
              options={properties.map((property) => ({ value: property.id, label: property.title }))}
            />
            <Select
              value={selectedRoom?.id ?? ""}
              onChange={(event) => setSelectedRoomId(event.target.value)}
              options={(selectedProperty?.rooms ?? []).map((room) => ({ value: room.id, label: room.title }))}
            />
          </div>
        </div>

        <div className="br-owner-calendar-controls__toolbar">
          <Tabs
            ariaLabel="Режим календаря занятости агента"
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
            <StatCard title="Объект" value={selectedProperty?.title ?? "Объект"} subtitle={selectedRoom.title} />
            <StatCard
              title="Занятые диапазоны"
              value={String(selectedRoom.busyRanges.length)}
              subtitle={nearestBusyRange ? `Ближайший: ${formatDateLabel(nearestBusyRange.startsOn)}` : "Занятые даты не отмечены"}
            />
            <StatCard
              title="Ближайший период"
              value={
                nearestBusyRange
                  ? `${formatShortDateLabel(nearestBusyRange.startsOn)} - ${formatShortDateLabel(nearestBusyRange.endsOn)}`
                  : "Нет занятых дат"
              }
              subtitle={nearestBusyRange?.label || "Только чтение"}
            />
          </div>
        ) : null}
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-owner-calendar-monthbar">
          <strong>{formatMonthLabel(currentMonth)}</strong>
          <span>{selectedRoom ? `Номер: ${selectedRoom.title}` : "Выберите номер для просмотра."}</span>
        </div>

        {mode === "overview" ? (
          <div className="br-owner-calendar-overview">
            {(selectedProperty?.rooms ?? []).map((room) => {
              const overviewDays = getOverviewDays(room.busyRanges);
              const roomNearestBusyRange = getNearestBusyRange(room.busyRanges);

              return (
                <article key={room.id} className="br-owner-calendar-overview__row">
                  <div className="br-owner-calendar-overview__meta">
                    <div>
                      <strong>{room.title}</strong>
                      <p>Занятых диапазонов: {room.busyRanges.length}</p>
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
              {monthDays.map((day) => (
                <div
                  key={day.key}
                  className={`br-calendar-day br-owner-calendar-day${day.busyRange ? " br-calendar-day--busy" : ""}${!day.inCurrentMonth ? " br-calendar-day--outside" : ""}${day.isToday ? " br-calendar-day--today" : ""}`}
                >
                  <span className="br-owner-calendar-day__date">{day.date.getDate()}</span>
                  <small>{day.busyRange?.label || (day.busyRange ? "Занято" : "Свободно")}</small>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="br-empty-state">
            <strong>Нет доступных номеров</strong>
            <p>У активного сотрудничества пока нет подключенных номеров для просмотра календаря занятости.</p>
          </div>
        )}
      </section>
    </section>
  );
}
