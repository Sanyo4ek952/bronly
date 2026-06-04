"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { PublicRoom, PublicStayFilters } from "@/entities/room";
import { Button, ButtonLink, Input, Select, StatCard } from "@/shared/ui";

type PublicRoomBrowserProps = {
  publicBaseHref: string;
  propertySlug: string;
  rooms: PublicRoom[];
  filters: PublicStayFilters;
  requestHrefBuilder?: (roomId: string, filters: PublicStayFilters) => string;
  resetHref?: string;
  showFilter?: boolean;
  showSelectedRoomSummary?: boolean;
};

function formatRoomMeta(room: PublicRoom) {
  return `${room.capacity} гостя(ей) • ${room.bedrooms} спальни • ${room.area} м²`;
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}

function formatRoomPrice(room: PublicRoom, hasDates: boolean) {
  if (hasDates && room.totalPrice && room.nights) {
    return `${formatMoney(room.totalPrice)} за ${room.nights} ноч.`;
  }

  return `от ${formatMoney(room.displayPricePerNight ?? room.pricePerNight)} / ночь`;
}

function buildPublicRequestHref(publicBaseHref: string, propertySlug: string, roomId: string, filters: PublicStayFilters) {
  const params = new URLSearchParams({ propertySlug, roomId });

  if (filters.hasDates) {
    params.set("checkIn", filters.checkIn);
    params.set("checkOut", filters.checkOut);
  }

  params.set("adults", String(filters.adults));
  params.set("rooms", String(filters.rooms));

  return `${publicBaseHref}/request?${params.toString()}`;
}

export function PublicRoomBrowser({
  publicBaseHref,
  propertySlug,
  rooms,
  filters,
  requestHrefBuilder,
  resetHref,
  showFilter = true,
  showSelectedRoomSummary = true,
}: PublicRoomBrowserProps) {
  const defaultRoom = rooms.find((room) => room.isAvailableForFilter) ?? rooms[0];
  const [selectedRoomId, setSelectedRoomId] = useState(defaultRoom?.id ?? "");
  const resolveRequestHref =
    requestHrefBuilder ??
    ((roomId: string, currentFilters: PublicStayFilters) =>
      buildPublicRequestHref(publicBaseHref, propertySlug, roomId, currentFilters));

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? defaultRoom,
    [defaultRoom, rooms, selectedRoomId],
  );
  const suitableRooms = rooms.filter((room) => room.isAvailableForFilter);
  const unsuitableRooms = rooms.filter((room) => !room.isAvailableForFilter);

  return (
    <>
      {showFilter ? (
        <form className="br-public-filter br-card" method="get">
          <Input id="public-check-in" name="checkIn" type="date" label="Заезд" defaultValue={filters.checkIn} />
          <Input id="public-check-out" name="checkOut" type="date" label="Выезд" defaultValue={filters.checkOut} />
          <Select
            id="public-adults"
            name="adults"
            label="Гости"
            defaultValue={String(filters.adults)}
            options={Array.from({ length: 8 }, (_, index) => {
              const value = String(index + 1);
              return { value, label: value };
            })}
          />
          <Select
            id="public-rooms"
            name="rooms"
            label="Комнат"
            defaultValue={String(filters.rooms)}
            options={Array.from({ length: 5 }, (_, index) => {
              const value = String(index + 1);
              return { value, label: value };
            })}
          />
          <div className="br-public-filter__actions">
            <Button type="submit" fullWidth>
              Уточнить доступность
            </Button>
            <ButtonLink href={resetHref ?? publicBaseHref} variant="secondary" fullWidth>
              Сбросить
            </ButtonLink>
          </div>
        </form>
      ) : null}

      {filters.hasDates ? (
        <div className="br-inline-notice" style={{ marginTop: 18 }}>
          Показана доступность с {filters.checkIn} по {filters.checkOut}. Итоговая сумма считается по ночам.
        </div>
      ) : null}

      <RoomGrid
        title={suitableRooms.length ? "Подходящие номера" : "Номера"}
        emptyText="По выбранным параметрам подходящих номеров нет. Ниже показаны остальные варианты."
        filters={filters}
        rooms={suitableRooms.length ? suitableRooms : []}
        selectedRoomId={selectedRoomId}
        onSelect={setSelectedRoomId}
        requestHrefBuilder={resolveRequestHref}
      />

      {unsuitableRooms.length ? (
        <RoomGrid
          title="Остальные варианты"
          filters={filters}
          rooms={unsuitableRooms}
          selectedRoomId={selectedRoomId}
          onSelect={setSelectedRoomId}
          requestHrefBuilder={resolveRequestHref}
          muted
        />
      ) : null}

      {selectedRoom && showSelectedRoomSummary ? (
        <div className="br-public-selected-room">
          <div className="br-section-heading">
            <h2>Выбранный номер</h2>
            <p>Заявка будет создана на конкретный номер. Владелец свяжется с вами и уточнит доступность.</p>
          </div>
          <div className="br-public-selected-room__grid">
            <StatCard title="Номер" value={selectedRoom.title} subtitle={selectedRoom.subtitle} />
            <StatCard
              title={filters.hasDates ? "Итого" : "Цена за ночь"}
              value={
                filters.hasDates && selectedRoom.totalPrice
                  ? formatMoney(selectedRoom.totalPrice)
                  : formatMoney(selectedRoom.displayPricePerNight ?? selectedRoom.pricePerNight)
              }
              subtitle={filters.hasDates && selectedRoom.nights ? `${selectedRoom.nights} ноч.` : "без выбранных дат"}
            />
            <StatCard title="Вместимость" value={`${selectedRoom.capacity} гостя(ей)`} />
          </div>
          {selectedRoom.unavailableReason ? <p className="br-public-room-warning">{selectedRoom.unavailableReason}</p> : null}
          <div className="br-public-selected-room__actions">
            <ButtonLink href={resolveRequestHref(selectedRoom.id, filters)}>Оставить заявку на этот номер</ButtonLink>
          </div>
        </div>
      ) : null}
    </>
  );
}

function RoomGrid({
  title,
  emptyText,
  filters,
  rooms,
  selectedRoomId,
  onSelect,
  requestHrefBuilder,
  muted = false,
}: {
  title: string;
  emptyText?: string;
  filters: PublicStayFilters;
  rooms: PublicRoom[];
  selectedRoomId: string;
  onSelect: (roomId: string) => void;
  requestHrefBuilder: (roomId: string, filters: PublicStayFilters) => string;
  muted?: boolean;
}) {
  return (
    <section className={muted ? "br-public-room-section br-public-room-section--muted" : "br-public-room-section"}>
      <div className="br-section-heading">
        <h3>{title}</h3>
        {emptyText && !rooms.length ? <p>{emptyText}</p> : null}
      </div>
      <div className="br-public-room-grid">
        {rooms.map((room) => (
          <article
            key={room.id}
            className={`br-public-room-card br-card${selectedRoomId === room.id ? " br-public-room-card--selected" : ""}`}
          >
            <div className="br-public-room-card__image">
              {room.photos[0] ? (
                <Image
                  src={room.photos[0].url}
                  alt={room.title}
                  width={1200}
                  height={800}
                  unoptimized
                  className="br-public-room-card__image-content"
                />
              ) : null}
            </div>
            <div className="br-public-room-card__body">
              <strong>{room.title}</strong>
              <span>{formatRoomMeta(room)}</span>
              {room.unavailableReason ? <small>{room.unavailableReason}</small> : null}
              <div className="br-public-room-card__footer">
                <strong>{formatRoomPrice(room, filters.hasDates)}</strong>
                <Button variant={selectedRoomId === room.id ? "primary" : "secondary"} onClick={() => onSelect(room.id)}>
                  {selectedRoomId === room.id ? "Выбрано" : "Выбрать"}
                </Button>
              </div>
              {room.isAvailableForFilter ? (
                <ButtonLink href={requestHrefBuilder(room.id, filters)} variant="secondary" fullWidth>
                  Оставить заявку
                </ButtonLink>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
