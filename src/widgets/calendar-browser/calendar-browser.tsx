"use client";

import { useMemo, useState } from "react";

import type { CalendarBlock } from "@/entities/calendar-block";
import type { Room } from "@/entities/room";
import { Button, Input, Select, Tabs } from "@/shared/ui";

type CalendarBrowserProps = {
  rooms: Room[];
  calendarBlocks: CalendarBlock[];
};

type CalendarView = "month" | "week" | "day";

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function CalendarBrowser({ rooms, calendarBlocks }: CalendarBrowserProps) {
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id ?? "");
  const [view, setView] = useState<CalendarView>("month");

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0],
    [rooms, selectedRoomId],
  );

  return (
    <section className="br-dashboard-section-grid">
      <aside className="br-calendar-sidebar">
        <section className="br-card br-dashboard-block">
          <h2>Выберите номер</h2>
          <Select
            value={selectedRoomId}
            onChange={(event) => setSelectedRoomId(event.target.value)}
            options={rooms.map((room) => ({ value: room.id, label: room.title }))}
          />
          <div className="br-selected-room-meta">
            <strong>{selectedRoom?.title}</strong>
            <span>{selectedRoom?.subtitle}</span>
          </div>
        </section>

        <section className="br-card br-dashboard-block">
          <h2>Легенда статусов</h2>
          <ul className="br-legend-list">
            <li><span className="br-legend-dot br-legend-dot--busy" /> Занято</li>
            <li><span className="br-legend-dot br-legend-dot--request" /> Заявка</li>
            <li><span className="br-legend-dot br-legend-dot--blocked" /> Недоступно</li>
            <li><span className="br-legend-dot br-legend-dot--free" /> Свободно</li>
          </ul>
        </section>
      </aside>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Май 2024</h2>
            <p>Календарь занятости для номера: {selectedRoom?.title}</p>
          </div>
          <div className="br-calendar-toolbar">
            <Button variant="secondary">Сегодня</Button>
            <Tabs
              ariaLabel="Режим календаря"
              className="br-tab-row--compact"
              items={[
                { value: "month", label: "Месяц" },
                { value: "week", label: "Неделя" },
                { value: "day", label: "День" },
              ]}
              value={view}
              onChange={(value) => setView(value as CalendarView)}
            />
          </div>
        </div>

        <div className="br-calendar-grid">
          {weekDays.map((day) => (
            <div key={day} className="br-calendar-grid__head">{day}</div>
          ))}
          {calendarBlocks.map((block) => (
            <div
              key={`${selectedRoomId}-${block.day}`}
              className={`br-calendar-day${block.type === "busy" ? " br-calendar-day--busy" : ""}${block.type === "request" ? " br-calendar-day--request" : ""}${block.type === "blocked" ? " br-calendar-day--blocked" : ""}`}
            >
              <span>{block.day <= 31 ? block.day : block.day - 31}</span>
              {block.label ? <small>{block.label}</small> : null}
            </div>
          ))}
        </div>

        <div className="br-calendar-modal br-card">
          <div className="br-calendar-modal__header">
            <strong>Добавить блок</strong>
            <button type="button" className="br-link-button">Закрыть</button>
          </div>
          <div className="br-calendar-modal__grid">
            <Select
              label="Номер"
              value={selectedRoomId}
              onChange={(event) => setSelectedRoomId(event.target.value)}
              options={rooms.map((room) => ({ value: room.id, label: room.title }))}
            />
            <div className="br-form-field">
              <label className="br-label">Тип блока</label>
              <div className="br-option-row">
                <button className="br-option-pill br-option-pill--busy" type="button">Занято</button>
                <button className="br-option-pill br-option-pill--request" type="button">Заявка</button>
                <button className="br-option-pill br-option-pill--blocked" type="button">Недоступно</button>
              </div>
            </div>
            <div className="br-inline-fields">
              <Input label="Дата начала" defaultValue="24.05.2024" />
              <Input label="Дата конца" defaultValue="25.05.2024" />
            </div>
          </div>
          <div className="br-active-step__actions">
            <Button variant="secondary">Отмена</Button>
            <Button>Добавить блок</Button>
          </div>
        </div>
      </section>
    </section>
  );
}
