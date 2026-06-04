"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { formatRoomMeta, formatRoomPrice, type Room } from "@/entities/room";
import { Button, Select, StatusPill, Tabs } from "@/shared/ui";

type RoomsBrowserProps = {
  rooms: Room[];
};

type RoomFilter = "all" | "active" | "inactive";
type SortMode = "price-desc" | "price-asc" | "title";

export function RoomsBrowser({ rooms }: RoomsBrowserProps) {
  const [filter, setFilter] = useState<RoomFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("price-desc");
  const [showLargeRooms, setShowLargeRooms] = useState(false);

  const tabItems = [
    { value: "all", label: `Все (${rooms.length})` },
    { value: "active", label: `Активные (${rooms.filter((room) => room.status === "active").length})` },
    { value: "inactive", label: `Неактивные (${rooms.filter((room) => room.status === "inactive").length})` },
  ];

  const filteredRooms = useMemo(() => {
    let nextRooms = [...rooms];

    if (filter !== "all") {
      nextRooms = nextRooms.filter((room) => room.status === filter);
    }

    if (showLargeRooms) {
      nextRooms = nextRooms.filter((room) => room.capacity >= 3);
    }

    if (sortMode === "price-asc") {
      nextRooms.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (sortMode === "price-desc") {
      nextRooms.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else {
      nextRooms.sort((a, b) => a.title.localeCompare(b.title, "ru"));
    }

    return nextRooms;
  }, [filter, rooms, showLargeRooms, sortMode]);

  return (
    <>
      <div className="br-rooms-toolbar">
        <div className="br-rooms-toolbar__actions">
          <Button variant={showLargeRooms ? "primary" : "secondary"} onClick={() => setShowLargeRooms((value) => !value)}>
            {showLargeRooms ? "Показаны от 3 гостей" : "Показать от 3 гостей"}
          </Button>
          <Select
            className="br-select-inline"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            options={[
              { value: "price-desc", label: "Сортировка: цена (вниз)" },
              { value: "price-asc", label: "Сортировка: цена (вверх)" },
              { value: "title", label: "Сортировка: название" },
            ]}
          />
        </div>
      </div>

      <Tabs ariaLabel="Фильтр номеров" items={tabItems} value={filter} onChange={(value) => setFilter(value as RoomFilter)} />

      <div className="br-room-list">
        {filteredRooms.map((room) => (
          <article key={room.id} className="br-room-card">
            <div className="br-room-card__thumb">
              {room.photos[0] ? (
                <Image
                  src={room.photos[0].url}
                  alt={room.title}
                  width={900}
                  height={700}
                  unoptimized
                  className="br-public-room-card__image-content"
                />
              ) : null}
            </div>
            <div className="br-room-card__content">
              <div className="br-room-card__header">
                <div>
                  <strong>{room.title}</strong>
                  <p>{room.subtitle}</p>
                </div>
                <StatusPill variant={room.status}>{room.status === "active" ? "Активен" : "Неактивен"}</StatusPill>
              </div>
              <div className="br-room-card__meta">{formatRoomMeta(room)}</div>
            </div>
            <div className="br-room-card__price">{formatRoomPrice(room)}</div>
          </article>
        ))}
      </div>
    </>
  );
}
