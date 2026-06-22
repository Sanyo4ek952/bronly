"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { PublicRoom, PublicStayFilters } from "@/entities/room";
import { Button, ButtonLink, Input, SectionSubtitle, SectionTitle, Select, StatCard } from "@/shared/ui";

type PublicRoomBrowserProps = {
  publicBaseHref: string;
  propertySlug?: string;
  rooms: PublicRoom[];
  filters: PublicStayFilters;
  resetHref?: string;
  showFilter?: boolean;
  showSelectedRoomSummary?: boolean;
  showStickyCta?: boolean;
  selectedRoomTitle?: string;
  selectedRoomDescription?: string;
  selectionHint?: string;
  cardActionLabel?: string;
};

function formatRoomMeta(room: PublicRoom) {
  return `${room.capacity} гостей • ${room.bedrooms} комнат • ${room.area} м²`;
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

function formatLocation(room: PublicRoom) {
  const city = room.location?.city?.trim();
  const address = room.location?.address?.trim();

  return [city, address].filter(Boolean).join(", ");
}

function getRoomActionLabel(room: PublicRoom) {
  return room.isAvailableForFilter ? "Оставить заявку" : "Уточнить доступность";
}

function buildPublicRequestHref(
  publicBaseHref: string,
  propertySlug: string | undefined,
  room: PublicRoom,
  filters: PublicStayFilters,
) {
  const params = new URLSearchParams({ roomId: room.id });
  const resolvedPropertySlug = propertySlug || room.propertySlug || undefined;

  if (resolvedPropertySlug) {
    params.set("propertySlug", resolvedPropertySlug);
  }

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
  resetHref,
  showFilter = true,
  showSelectedRoomSummary = true,
  showStickyCta = false,
  selectedRoomTitle = "Выбранный номер",
  selectedRoomDescription = "Заявка будет создана на конкретный номер. Владелец свяжется с вами и уточнит доступность.",
  selectionHint = "Сначала выберите конкретный номер, затем переходите к заявке по нему.",
  cardActionLabel,
}: PublicRoomBrowserProps) {
  const defaultRoom = useMemo(() => rooms.find((room) => room.isAvailableForFilter) ?? rooms[0], [rooms]);
  const [selectedRoomId, setSelectedRoomId] = useState(defaultRoom?.id ?? "");
  const resolvedSelectedRoomId = rooms.some((room) => room.id === selectedRoomId) ? selectedRoomId : (defaultRoom?.id ?? rooms[0]?.id ?? "");

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === resolvedSelectedRoomId) ?? defaultRoom,
    [defaultRoom, resolvedSelectedRoomId, rooms],
  );
  const suitableRooms = rooms.filter((room) => room.isAvailableForFilter);
  const unsuitableRooms = rooms.filter((room) => !room.isAvailableForFilter);
  const stickyTargetRoom = selectedRoom ?? defaultRoom;
  const resolveRequestHref = (room: PublicRoom, currentFilters: PublicStayFilters) =>
    buildPublicRequestHref(publicBaseHref, propertySlug, room, currentFilters);

  return (
    <>
      {showFilter ? (
        <form className="br-public-filter br-card" method="get">
          <div className="br-public-filter__field">
            <Input id="public-check-in" name="checkIn" type="date" label="Заезд" defaultValue={filters.checkIn} />
          </div>
          <div className="br-public-filter__field">
            <Input id="public-check-out" name="checkOut" type="date" label="Выезд" defaultValue={filters.checkOut} />
          </div>
          <div className="br-public-filter__field">
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
          </div>
          <div className="br-public-filter__field">
            <Select
              id="public-rooms"
              name="rooms"
              label="Комнаты"
              defaultValue={String(filters.rooms)}
              options={Array.from({ length: 5 }, (_, index) => {
                const value = String(index + 1);
                return { value, label: value };
              })}
            />
          </div>
          <div className="br-public-filter__actions">
            <Button type="submit" fullWidth>
              Подобрать номера
            </Button>
            <ButtonLink href={resetHref ?? publicBaseHref} variant="secondary" fullWidth>
              Сбросить
            </ButtonLink>
          </div>
        </form>
      ) : null}

      {filters.hasDates ? (
        <div className="br-inline-notice br-inline-notice--soft" style={{ marginTop: 18 }}>
          Показаны варианты с {filters.checkIn} по {filters.checkOut}. Итоговая сумма считается по ночам.
        </div>
      ) : null}

      <RoomGrid
        title="Подходящие номера"
        emptyText="По выбранным параметрам подходящих номеров нет. Ниже показаны остальные варианты."
        filters={filters}
        rooms={suitableRooms}
        selectedRoomId={resolvedSelectedRoomId}
        onSelect={setSelectedRoomId}
        requestHrefBuilder={resolveRequestHref}
        cardActionLabel={cardActionLabel}
      />

      {unsuitableRooms.length ? (
        <RoomGrid
          title="Остальные варианты"
          filters={filters}
          rooms={unsuitableRooms}
          selectedRoomId={resolvedSelectedRoomId}
          onSelect={setSelectedRoomId}
          requestHrefBuilder={resolveRequestHref}
          muted
          cardActionLabel={cardActionLabel}
        />
      ) : null}

      {selectedRoom && showSelectedRoomSummary ? (
        <div className="br-public-selected-room">
          <div className="br-section-heading">
            <SectionTitle>{selectedRoomTitle}</SectionTitle>
            <SectionSubtitle>{selectedRoomDescription}</SectionSubtitle>
          </div>
          <div className="br-inline-notice br-inline-notice--soft br-public-selected-room__notice">{selectionHint}</div>
          <div className="br-public-selected-room__grid">
            <StatCard
              title="Номер"
              value={selectedRoom.title}
              subtitle={selectedRoom.propertyTitle || selectedRoom.subtitle || "Прямой запрос на проживание"}
            />
            <StatCard
              title={filters.hasDates ? "Итого" : "Цена за ночь"}
              value={
                filters.hasDates && selectedRoom.totalPrice
                  ? formatMoney(selectedRoom.totalPrice)
                  : formatMoney(selectedRoom.displayPricePerNight ?? selectedRoom.pricePerNight)
              }
              subtitle={filters.hasDates && selectedRoom.nights ? `${selectedRoom.nights} ноч.` : "без выбранных дат"}
            />
            <StatCard title="Вместимость" value={`${selectedRoom.capacity} гостей`} subtitle={formatRoomMeta(selectedRoom)} />
          </div>
          {selectedRoom.unavailableReason ? <p className="br-public-room-warning">{selectedRoom.unavailableReason}</p> : null}
          <div className="br-public-selected-room__actions">
            <ButtonLink href={resolveRequestHref(selectedRoom, filters)}>
              {cardActionLabel ?? `Оставить заявку на номер ${selectedRoom.title}`}
            </ButtonLink>
          </div>
        </div>
      ) : null}

      {showStickyCta && stickyTargetRoom ? (
        <div className="br-public-sticky-cta">
          <div className="br-public-sticky-cta__copy">
            <strong>{stickyTargetRoom.title}</strong>
            <span>{formatRoomPrice(stickyTargetRoom, filters.hasDates)}</span>
          </div>
          <ButtonLink href={resolveRequestHref(stickyTargetRoom, filters)} className="br-public-sticky-cta__button">
            Оставить заявку на этот номер
          </ButtonLink>
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
  cardActionLabel,
}: {
  title: string;
  emptyText?: string;
  filters: PublicStayFilters;
  rooms: PublicRoom[];
  selectedRoomId: string;
  onSelect: (roomId: string) => void;
  requestHrefBuilder: (room: PublicRoom, filters: PublicStayFilters) => string;
  muted?: boolean;
  cardActionLabel?: string;
}) {
  return (
    <section className={muted ? "br-public-room-section br-public-room-section--muted" : "br-public-room-section"}>
      <div className="br-section-heading">
        <SectionTitle as="h3">{title}</SectionTitle>
        {emptyText && !rooms.length ? <SectionSubtitle>{emptyText}</SectionSubtitle> : null}
      </div>
      {rooms.length ? (
        <div className="br-public-room-grid">
          {rooms.map((room) => {
            const location = formatLocation(room);

            return (
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
                  {room.propertyTitle ? <span className="br-public-room-card__eyebrow">{room.propertyTitle}</span> : null}
                  <strong>{room.title}</strong>
                  {location ? <span className="br-public-room-card__location">{location}</span> : null}
                  <span>{formatRoomMeta(room)}</span>
                  {room.unavailableReason ? <small>{room.unavailableReason}</small> : null}
                  <div className="br-public-room-card__footer">
                    <strong>{formatRoomPrice(room, filters.hasDates)}</strong>
                    <Button variant={selectedRoomId === room.id ? "primary" : "secondary"} onClick={() => onSelect(room.id)}>
                      {selectedRoomId === room.id ? "Выбрано" : "Выбрать номер"}
                    </Button>
                  </div>
                  <p className="br-public-room-card__request-hint">Заявка отправляется только по этому номеру.</p>
                  <ButtonLink href={requestHrefBuilder(room, filters)} variant="secondary" fullWidth>
                    {cardActionLabel ?? getRoomActionLabel(room)}
                  </ButtonLink>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
