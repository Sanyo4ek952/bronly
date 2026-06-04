"use client";

import { useState } from "react";

import type { AgentCalendarBusyRange, AgentCalendarPropertyItem } from "@/entities/collaboration";
import { formatDateLabel } from "@/shared/lib/date";
import { Button, Select, StatCard } from "@/shared/ui";

type AgentCalendarBrowserProps = {
  properties: AgentCalendarPropertyItem[];
};

type CalendarDay = {
  key: string;
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  isBusy: boolean;
  label: string;
};

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, amount: number) {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthDays(month: Date, busyRanges: AgentCalendarBusyRange[]): CalendarDay[] {
  const firstDay = startOfMonth(month);
  const firstWeekDay = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstWeekDay);
  const todayKey = formatDateKey(new Date());
  const busyIntervals = busyRanges.map((range) => ({
    startsOn: range.startsOn,
    endsOn: range.endsOn,
    label: range.label,
  }));

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    const currentKey = formatDateKey(current);
    const busyRange = busyIntervals.find((range) => currentKey >= range.startsOn && currentKey <= range.endsOn);

    return {
      key: currentKey,
      date: current,
      inCurrentMonth: current.getMonth() === month.getMonth(),
      isToday: currentKey === todayKey,
      isBusy: Boolean(busyRange),
      label: busyRange?.label || (busyRange ? "Занято" : ""),
    };
  });
}

function getNearestBusyRange(busyRanges: AgentCalendarBusyRange[]) {
  const today = formatDateKey(new Date());
  const sortedRanges = [...busyRanges].sort((a, b) => a.startsOn.localeCompare(b.startsOn));

  return sortedRanges.find((range) => range.endsOn >= today) ?? sortedRanges[0] ?? null;
}

export function AgentCalendarBrowser({ properties }: AgentCalendarBrowserProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id ?? "");
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const selectedProperty = properties.find((property) => property.id === selectedPropertyId) ?? properties[0] ?? null;
  const [selectedRoomId, setSelectedRoomId] = useState(selectedProperty?.rooms[0]?.id ?? "");
  const selectedRoom = selectedProperty?.rooms.find((room) => room.id === selectedRoomId) ?? selectedProperty?.rooms[0] ?? null;
  const nearestBusyRange = selectedRoom ? getNearestBusyRange(selectedRoom.busyRanges) : null;
  const days = selectedRoom ? getMonthDays(currentMonth, selectedRoom.busyRanges) : [];

  function handlePropertyChange(propertyId: string) {
    setSelectedPropertyId(propertyId);
    const nextProperty = properties.find((property) => property.id === propertyId) ?? null;
    setSelectedRoomId(nextProperty?.rooms[0]?.id ?? "");
  }

  return (
    <section className="br-dashboard-section-grid">
      <aside className="br-calendar-sidebar">
        <section className="br-card br-dashboard-block">
          <h2>Подключенный объект</h2>
          <Select
            value={selectedProperty?.id ?? ""}
            onChange={(event) => handlePropertyChange(event.target.value)}
            options={properties.map((property) => ({ value: property.id, label: property.title }))}
          />
          <Select
            label="Номер"
            value={selectedRoom?.id ?? ""}
            onChange={(event) => setSelectedRoomId(event.target.value)}
            options={(selectedProperty?.rooms ?? []).map((room) => ({ value: room.id, label: room.title }))}
          />
          {selectedRoom ? (
            <div className="br-selected-room-meta">
              <strong>{selectedRoom.title}</strong>
              <span>{selectedRoom.subtitle || "Номер подключен по активному сотрудничеству."}</span>
            </div>
          ) : null}
        </section>

        <section className="br-card br-dashboard-block">
          <h2>Легенда</h2>
          <ul className="br-legend-list">
            <li>
              <span className="br-legend-dot br-legend-dot--busy" /> Занято
            </li>
            <li>
              <span className="br-legend-dot br-legend-dot--free" /> Свободно
            </li>
          </ul>
        </section>

        {selectedRoom ? (
          <section className="br-agent-calendar-summary">
            <StatCard title="Объект" value={selectedProperty?.title ?? "Объект"} subtitle={selectedRoom.title} />
            <StatCard
              title="Занятые диапазоны"
              value={String(selectedRoom.busyRanges.length)}
              subtitle={nearestBusyRange ? `Ближайший: ${formatDateLabel(nearestBusyRange.startsOn)}` : "Свободные даты пока не отмечены"}
            />
            <StatCard
              title="Ближайший период"
              value={
                nearestBusyRange
                  ? `${formatDateLabel(nearestBusyRange.startsOn)} - ${formatDateLabel(nearestBusyRange.endsOn)}`
                  : "Нет занятых дат"
              }
              subtitle={nearestBusyRange?.label || "Только чтение"}
            />
          </section>
        ) : null}
      </aside>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Календарь занятости</h2>
            <p>{selectedRoom ? `Только чтение для номера: ${selectedRoom.title}` : "Выберите номер для просмотра занятых дат."}</p>
          </div>
          <div className="br-calendar-toolbar">
            <Button variant="secondary" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
              Назад
            </Button>
            <Button variant="secondary" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>
              Сегодня
            </Button>
            <Button variant="secondary" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              Вперед
            </Button>
          </div>
        </div>

        {selectedRoom ? (
          <>
            <div className="br-agent-calendar-month">
              <strong>{formatMonthLabel(currentMonth)}</strong>
              <span>Занятые даты владельца доступны только для просмотра.</span>
            </div>

            <div className="br-calendar-grid">
              {weekDays.map((day) => (
                <div key={day} className="br-calendar-grid__head">
                  {day}
                </div>
              ))}
              {days.map((day) => (
                <div
                  key={day.key}
                  className={`br-calendar-day${day.isBusy ? " br-calendar-day--busy" : ""}${!day.inCurrentMonth ? " br-calendar-day--outside" : ""}${day.isToday ? " br-calendar-day--today" : ""}`}
                >
                  <span>{day.date.getDate()}</span>
                  {day.label ? <small>{day.label}</small> : <small>{day.isBusy ? "Занято" : "Свободно"}</small>}
                </div>
              ))}
            </div>
          </>
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
