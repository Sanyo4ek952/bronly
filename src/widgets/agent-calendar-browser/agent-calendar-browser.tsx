"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Dot } from "lucide-react";

import type { AgentCalendarBusyRange, AgentCalendarPropertyItem, AgentCalendarRoomItem } from "@/entities/collaboration";
import { formatDateLabel } from "@/shared/lib/date";
import { AppIcon, Button, IconButton, StatCard } from "@/shared/ui";
import {
  addMonths,
  formatMonthRangeLabel,
  formatShortDateLabel,
  getNearestBusyRange,
  getTimelineBusyRanges,
  getTimelineDays,
} from "@/widgets/calendar/lib/calendar-helpers";

function getRoomSummary(room: AgentCalendarRoomItem) {
  if (!room.busyRanges.length) {
    return "Свободно";
  }

  return `${room.busyRanges.length} занятых диапазонов`;
}

function getRangeLabel(range: AgentCalendarBusyRange) {
  return range.label || "Занято";
}

export function AgentCalendarBrowser({ properties }: { properties: AgentCalendarPropertyItem[] }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id ?? "");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? properties[0] ?? null,
    [properties, selectedPropertyId],
  );
  const timelineDays = useMemo(() => getTimelineDays(currentMonth), [currentMonth]);
  const nearestBusyRange = useMemo(() => {
    const busyRanges = (selectedProperty?.rooms ?? []).flatMap((room) => room.busyRanges);
    return getNearestBusyRange(busyRanges);
  }, [selectedProperty]);

  return (
    <section className="br-owner-stack">
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
          <span><Dot />Только чтение</span>
        </div>

        <div className="br-agent-calendar-summary">
          <div className="br-owner-calendar-stats">
            <StatCard
              title="Подключенный объект"
              value={selectedProperty?.title || "Нет объекта"}
              subtitle={selectedProperty?.subtitle || "Календарь доступен только для чтения"}
            />
            <StatCard
              title="Номера"
              value={String(selectedProperty?.rooms.length ?? 0)}
              subtitle="Показываются только активные сотрудничества"
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

          <div className="br-calendar-collection-pills">
            {properties.map((property) => (
              <button
                key={property.id}
                type="button"
                className={`br-calendar-collection-pill${selectedPropertyId === property.id ? " br-calendar-collection-pill--active" : ""}`}
                onClick={() => setSelectedPropertyId(property.id)}
              >
                <strong>{property.title}</strong>
                <span>{property.rooms.length} номеров</span>
              </button>
            ))}
          </div>
        </div>

        <div className="br-calendar-timeline">
          <div className="br-calendar-timeline__scroll">
            <div
              className="br-calendar-timeline__canvas"
              style={{ ["--calendar-columns" as string]: String(timelineDays.length) }}
            >
              <div className="br-calendar-timeline__header">
                <div className="br-calendar-timeline__spacer" />

                <div className="br-calendar-timeline__days">
                  {timelineDays.map((day) => (
                    <div
                      key={day.key}
                      className={`br-calendar-timeline__head${day.isToday ? " br-calendar-timeline__head--today" : ""}`}
                    >
                      <strong>{day.dayLabel}</strong>
                      <span>{day.weekDayLabel}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="br-calendar-timeline__rows">
                {(selectedProperty?.rooms ?? []).map((room, rowIndex) => {
                  const ranges = getTimelineBusyRanges(room.busyRanges, timelineDays);

                  return (
                    <div key={room.id} className="br-calendar-timeline__row">
                      <div className="br-calendar-room-card">
                        <span className={`br-calendar-room-card__badge br-calendar-room-card__badge--${(rowIndex % 4) + 1}`}>
                          {rowIndex + 1}
                        </span>
                        <span className="br-calendar-room-card__copy">
                          <strong>{room.title}</strong>
                          <small>{room.subtitle || getRoomSummary(room)}</small>
                        </span>
                      </div>

                      <div className="br-calendar-room-grid">
                        <div className="br-calendar-room-grid__cells">
                          {timelineDays.map((day) => {
                            const dayBusyRange =
                              room.busyRanges.find((range) => day.key >= range.startsOn && day.key <= range.endsOn) ?? null;

                            return (
                              <div
                                key={`${room.id}-${day.key}`}
                                className={`br-calendar-room-grid__cell${dayBusyRange ? " br-calendar-room-grid__cell--busy" : ""}${day.isToday ? " br-calendar-room-grid__cell--today" : ""}`}
                                aria-label={`${room.title}: ${formatDateLabel(day.date)}. ${dayBusyRange ? "Занято" : "Свободно"}.`}
                              />
                            );
                          })}
                        </div>

                        <div className="br-calendar-room-grid__ranges">
                          {ranges.map((range) => (
                            <div
                              key={range.busyRange.id}
                              className="br-calendar-range-card br-calendar-range-card--readonly"
                              style={{ gridColumn: `${range.startIndex + 1} / span ${range.span}` }}
                            >
                              <span className="br-calendar-range-card__label">
                                {range.clippedStart ? "…" : ""}
                                {getRangeLabel(range.busyRange)}
                                {range.clippedEnd ? "…" : ""}
                              </span>
                              <span className="br-calendar-range-card__meta">
                                {formatShortDateLabel(range.busyRange.startsOn)} - {formatShortDateLabel(range.busyRange.endsOn)}
                              </span>
                            </div>
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

        {selectedProperty?.rooms.length ? null : (
          <p className="br-owner-muted">У активного сотрудничества пока нет подключенных номеров для просмотра календаря занятости.</p>
        )}
      </section>
    </section>
  );
}
