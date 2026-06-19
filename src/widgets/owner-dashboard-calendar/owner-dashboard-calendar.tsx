"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, CalendarDays, ChevronLeft, ChevronRight, Dot, Home } from "lucide-react";

import type { OwnerCalendarInventoryGroup, OwnerCalendarInventoryRoom } from "@/entities/property";
import { formatDateLabel } from "@/shared/lib/date";
import { AppIcon, Button, ButtonLink, IconButton, StatCard } from "@/shared/ui";
import {
  addMonths,
  formatMonthRangeLabel,
  formatShortDateLabel,
  getNearestBusyRange,
  getTimelineBusyRanges,
  getTimelineDays,
} from "@/widgets/calendar/lib/calendar-helpers";

type OwnerDashboardCalendarProps = {
  groups: OwnerCalendarInventoryGroup[];
};

type GroupFilterKind = "all" | "property" | "standalone";

function getRoomSummary(room: OwnerCalendarInventoryRoom) {
  if (!room.busyRanges.length) {
    return room.subtitle || "Свободные даты";
  }

  const ranges = `${room.busyRanges.length} занятых диапазонов`;
  return room.subtitle ? `${room.subtitle} · ${ranges}` : ranges;
}

function getRangeLabel(room: OwnerCalendarInventoryRoom) {
  return room.kind === "standalone_room" ? "Открыть календарь номера" : "Открыть календарь объекта";
}

export function OwnerDashboardCalendar({ groups }: OwnerDashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [groupFilter, setGroupFilter] = useState<GroupFilterKind>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  const timelineDays = useMemo(() => getTimelineDays(currentMonth), [currentMonth]);
  const visibleGroups = useMemo(() => {
    const filteredByKind = groups.filter((group) => {
      if (groupFilter === "property") {
        return group.kind === "property";
      }

      if (groupFilter === "standalone") {
        return group.kind === "standalone";
      }

      return true;
    });

    if (selectedGroupId === "all") {
      return filteredByKind;
    }

    return filteredByKind.filter((group) => group.id === selectedGroupId);
  }, [groupFilter, groups, selectedGroupId]);

  const visibleRooms = useMemo(
    () => visibleGroups.flatMap((group) => group.rooms),
    [visibleGroups],
  );
  const nearestBusyRange = useMemo(
    () => getNearestBusyRange(visibleRooms.flatMap((room) => room.busyRanges)),
    [visibleRooms],
  );

  const totalRooms = visibleRooms.length;
  const busyRoomsInView = visibleRooms.filter((room) =>
    room.busyRanges.some((range) =>
      timelineDays.some((day) => day.key >= range.startsOn && day.key <= range.endsOn),
    ),
  ).length;

  return (
    <section className="br-owner-stack">
      <section className="br-calendar-shell br-card">
        <div className="br-calendar-shell__header">
          <div className="br-calendar-shell__heading">
            <div className="br-calendar-shell__icon">
              <AppIcon icon={CalendarDays} />
            </div>
            <div>
              <h3>Календарь кабинета</h3>
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
          <span><Dot />Переход в локальный календарь</span>
        </div>

        <div className="br-owner-calendar-overview__stats">
          <StatCard
            title="Номера в обзоре"
            value={String(totalRooms)}
            subtitle="Текущий набор строк после фильтров"
          />
          <StatCard
            title="Заняты в месяце"
            value={String(busyRoomsInView)}
            subtitle="Есть хотя бы один занятый диапазон в текущем месяце"
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

        <div className="br-owner-calendar-overview__filters">
          <div className="br-calendar-collection-pills">
            {[
              { id: "all", label: "Все", kind: "all" as const },
              { id: "property", label: "Объекты", kind: "property" as const },
              { id: "standalone", label: "Отдельные номера", kind: "standalone" as const },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={`br-calendar-collection-pill${groupFilter === item.kind ? " br-calendar-collection-pill--active" : ""}`}
                onClick={() => {
                  setGroupFilter(item.kind);
                  setSelectedGroupId("all");
                }}
              >
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>

          <div className="br-calendar-collection-pills">
            <button
              type="button"
              className={`br-calendar-collection-pill${selectedGroupId === "all" ? " br-calendar-collection-pill--active" : ""}`}
              onClick={() => setSelectedGroupId("all")}
            >
              <strong>Все группы</strong>
              <span>{visibleGroups.length || groups.length} в обзоре</span>
            </button>
            {groups
              .filter((group) => {
                if (groupFilter === "property") {
                  return group.kind === "property";
                }

                if (groupFilter === "standalone") {
                  return group.kind === "standalone";
                }

                return true;
              })
              .map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={`br-calendar-collection-pill${selectedGroupId === group.id ? " br-calendar-collection-pill--active" : ""}`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <strong>{group.title}</strong>
                  <span>{group.rooms.length} номеров</span>
                </button>
              ))}
          </div>
        </div>
      </section>

      {visibleGroups.length ? (
        visibleGroups.map((group) => (
          <section key={group.id} className="br-owner-calendar-overview-group br-card">
            <div className="br-owner-calendar-overview-group__header">
              <div className="br-owner-calendar-overview-group__copy">
                <div className="br-owner-calendar-overview-group__icon">
                  <AppIcon icon={group.kind === "property" ? Building2 : Home} />
                </div>
                <div>
                  <strong>{group.title}</strong>
                  <p>{group.subtitle}</p>
                </div>
              </div>

              <div className="br-owner-calendar-overview-group__actions">
                {group.kind === "property" ? (
                  <>
                    <ButtonLink href={group.detailHref} variant="secondary" size="sm">
                      Открыть объект
                    </ButtonLink>
                    <ButtonLink href={group.calendarHref} size="sm">
                      Календарь объекта
                    </ButtonLink>
                  </>
                ) : null}
              </div>
            </div>

            {group.rooms.length ? (
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
                      {group.rooms.map((room, rowIndex) => {
                        const ranges = getTimelineBusyRanges(room.busyRanges, timelineDays);

                        return (
                          <div key={room.id} className="br-calendar-timeline__row">
                            <div className="br-calendar-room-card">
                              <span className={`br-calendar-room-card__badge br-calendar-room-card__badge--${(rowIndex % 4) + 1}`}>
                                {rowIndex + 1}
                              </span>
                              <span className="br-calendar-room-card__copy">
                                <strong>{room.title}</strong>
                                <small>{getRoomSummary(room)}</small>
                                <Link href={room.calendarHref} className="br-owner-calendar-overview__room-link">
                                  {getRangeLabel(room)}
                                </Link>
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

                              <div className="br-calendar-room-grid__prices">
                                {timelineDays.map((day) => (
                                  <span key={`${room.id}-price-${day.key}`}>{room.pricePerNight.toLocaleString("ru-RU")}</span>
                                ))}
                              </div>

                              <div className="br-calendar-room-grid__ranges">
                                {ranges.map((range) => (
                                  <Link
                                    key={range.busyRange.id}
                                    href={room.calendarHref}
                                    className="br-calendar-range-card br-calendar-range-card--readonly"
                                    style={{ gridColumn: `${range.startIndex + 1} / span ${range.span}` }}
                                    aria-label={`${getRangeLabel(room)}: ${room.title}`}
                                  >
                                    <span className="br-calendar-range-card__label">
                                      {range.clippedStart ? "…" : ""}
                                      {range.busyRange.label || "Занято"}
                                      {range.clippedEnd ? "…" : ""}
                                    </span>
                                    <span className="br-calendar-range-card__meta">
                                      {formatShortDateLabel(range.busyRange.startsOn)} - {formatShortDateLabel(range.busyRange.endsOn)}
                                    </span>
                                  </Link>
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
            ) : (
              <p className="br-owner-muted">В этой группе пока нет номеров для календаря занятости.</p>
            )}
          </section>
        ))
      ) : (
        <section className="br-dashboard-block br-card">
          <div className="br-empty-state">
            <strong>Ничего не найдено по выбранным фильтрам</strong>
            <p>Сбросьте фильтры или откройте другой объект, чтобы посмотреть занятые даты.</p>
          </div>
        </section>
      )}
    </section>
  );
}
