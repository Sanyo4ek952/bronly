"use client";

import Image from "next/image";
import { useId, useMemo, useState } from "react";

import type { PublicRoom, PublicStayFilters } from "@/entities/room";
import { formatRubles } from "@/shared/lib/money";
import { Button, ButtonLink, InlineNotice, Input, Panel, Select, StatCard } from "@/shared/ui";

type PublicStayFilterProps = {
  publicBaseHref: string;
  filters: PublicStayFilters;
  resetHref?: string;
};

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

function formatRoomPrice(room: PublicRoom, hasDates: boolean) {
  if (hasDates && room.totalPrice != null && room.nights) {
    return `${formatRubles(Math.round(room.totalPrice))} за ${room.nights} ноч.`;
  }

  return `от ${formatRubles(Math.round(room.displayPricePerNight ?? room.pricePerNight))} / ночь`;
}

function formatLocation(room: PublicRoom) {
  const city = room.location?.city?.trim();
  const address = room.location?.address?.trim();

  return [city, address].filter(Boolean).join(", ");
}

function getRoomActionLabel(room: PublicRoom) {
  return room.isAvailableForFilter ? "Оставить заявку" : "Изменить параметры";
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

export function PublicStayFilter({ publicBaseHref, filters, resetHref }: PublicStayFilterProps) {
  const filterId = useId();

  return (
    <div className="grid gap-[18px]">
      <form
        method="get"
        aria-label="Параметры проживания"
        className="grid items-end gap-[14px] rounded-[var(--radius-lg)] border border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(220px,280px)]"
      >
        <Input id={`${filterId}-check-in`} name="checkIn" type="date" label="Заезд" defaultValue={filters.checkIn} />
        <Input id={`${filterId}-check-out`} name="checkOut" type="date" label="Выезд" defaultValue={filters.checkOut} />
        <Select
          id={`${filterId}-adults`}
          name="adults"
          label="Гости"
          defaultValue={String(filters.adults)}
          options={Array.from({ length: 8 }, (_, index) => {
            const value = String(index + 1);
            return { value, label: value };
          })}
        />
        <Select
          id={`${filterId}-rooms`}
          name="rooms"
          label="Комнаты"
          defaultValue={String(filters.rooms)}
          options={Array.from({ length: 5 }, (_, index) => {
            const value = String(index + 1);
            return { value, label: value };
          })}
        />
        <div className="grid gap-2.5">
          <Button type="submit" fullWidth>
            Подобрать номера
          </Button>
          <ButtonLink href={resetHref ?? publicBaseHref} variant="secondary" fullWidth>
            Сбросить
          </ButtonLink>
        </div>
      </form>

      {filters.hasDates ? (
        <InlineNotice tone="soft">
          Показаны варианты с {filters.checkIn} по {filters.checkOut}. Итоговая сумма рассчитана по ночам.
        </InlineNotice>
      ) : null}
    </div>
  );
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
  const resolvedSelectedRoomId = rooms.some((room) => room.id === selectedRoomId)
    ? selectedRoomId
    : (defaultRoom?.id ?? rooms[0]?.id ?? "");
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
    <div className="grid gap-6">
      {showFilter ? (
        <PublicStayFilter publicBaseHref={publicBaseHref} filters={filters} resetHref={resetHref} />
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
          description="Эти номера не подходят хотя бы по одному параметру. Причина указана в карточке."
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
        <Panel
          as="section"
          aria-live="polite"
          className="grid gap-[18px] border-[rgb(var(--color-primary-rgb)_/_0.10)] shadow-[var(--shadow-md)]"
          surface="raised"
          padding="lg"
        >
          <div className="grid gap-2">
            <h3 className="text-[clamp(1.25rem,2vw,1.6rem)] font-extrabold leading-tight">{selectedRoomTitle}</h3>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">{selectedRoomDescription}</p>
          </div>
          <InlineNotice tone="soft">{selectionHint}</InlineNotice>
          <div className="grid gap-[14px] md:grid-cols-3">
            <StatCard
              title="Номер"
              value={selectedRoom.title}
              subtitle={selectedRoom.propertyTitle || selectedRoom.subtitle || "Прямой запрос на проживание"}
            />
            <StatCard
              title={filters.hasDates ? "Итого" : "Цена за ночь"}
              value={
                filters.hasDates && selectedRoom.totalPrice != null
                  ? formatRubles(Math.round(selectedRoom.totalPrice))
                  : formatRubles(Math.round(selectedRoom.displayPricePerNight ?? selectedRoom.pricePerNight))
              }
              subtitle={filters.hasDates && selectedRoom.nights ? `${selectedRoom.nights} ноч.` : "без выбранных дат"}
            />
            <StatCard title="Вместимость" value={`${selectedRoom.capacity} гостей`} subtitle={formatRoomMeta(selectedRoom)} />
          </div>
          {!selectedRoom.isAvailableForFilter && selectedRoom.unavailableReason ? (
            <InlineNotice tone="warning" title="Параметры не подходят">
              {selectedRoom.unavailableReason}. В форме можно изменить даты, количество гостей или комнат.
            </InlineNotice>
          ) : null}
          <div className="flex justify-start">
            <ButtonLink href={resolveRequestHref(selectedRoom, filters)}>
              {cardActionLabel ?? `Оставить заявку на номер ${selectedRoom.title}`}
            </ButtonLink>
          </div>
        </Panel>
      ) : null}

      {showStickyCta && stickyTargetRoom ? (
        <div className="fixed inset-x-[14px] bottom-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-t-[20px] border border-[rgb(var(--color-primary-rgb)_/_0.12)] bg-[rgb(255_255_255_/_0.97)] p-3 pb-[calc(12px+var(--safe-area-bottom))] shadow-[var(--shadow-lg)] backdrop-blur-xl min-[721px]:hidden">
          <div className="grid min-w-0 gap-1">
            <strong className="block truncate">{stickyTargetRoom.title}</strong>
            <span className="block truncate text-[13px] text-[var(--text-muted)]">
              {formatRoomPrice(stickyTargetRoom, filters.hasDates)}
            </span>
          </div>
          <ButtonLink href={resolveRequestHref(stickyTargetRoom, filters)} className="w-auto" size="sm">
            Оставить заявку
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}

function RoomGrid({
  title,
  description,
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
  description?: string;
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
    <section className="grid gap-4">
      <div className="grid gap-2">
        <h3 className="text-2xl font-extrabold leading-tight">{title}</h3>
        {description ? <p className="text-sm leading-relaxed text-[var(--text-muted)]">{description}</p> : null}
        {emptyText && !rooms.length ? <p className="text-sm leading-relaxed text-[var(--text-muted)]">{emptyText}</p> : null}
      </div>
      {rooms.length ? (
        <div className="grid gap-[18px] min-[721px]:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => {
            const location = formatLocation(room);
            const selected = selectedRoomId === room.id;

            return (
              <Panel
                key={room.id}
                as="article"
                className={`grid overflow-hidden border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_250_/_0.96))] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-[180ms] hover:-translate-y-px ${
                  selected ? "border-[rgb(var(--color-primary-rgb)_/_0.36)] shadow-[0_18px_34px_rgb(var(--color-primary-rgb)_/_0.10)]" : ""
                } ${muted ? "opacity-95" : ""}`}
                padding="none"
              >
                <div className="min-h-[200px] overflow-hidden bg-[linear-gradient(135deg,#d7eae6_0%,#c3ddd9_42%,#f0e0ce_100%)]">
                  {room.photos[0] ? (
                    <Image
                      src={room.photos[0].url}
                      alt={room.title}
                      width={1200}
                      height={800}
                      unoptimized
                      className="h-full min-h-[200px] w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="grid gap-2.5 p-[18px]">
                  {room.propertyTitle ? (
                    <span className="inline-flex min-h-8 w-fit items-center rounded-full bg-[rgb(var(--color-primary-rgb)_/_0.10)] px-3 text-xs font-bold text-[var(--color-primary-hover)]">
                      {room.propertyTitle}
                    </span>
                  ) : null}
                  <strong className="text-lg leading-tight">{room.title}</strong>
                  {location ? <span className="text-[13px] leading-relaxed text-[var(--text-muted)]">{location}</span> : null}
                  <span className="text-sm text-[var(--text-muted)]">{formatRoomMeta(room)}</span>
                  {!room.isAvailableForFilter && room.unavailableReason ? (
                    <InlineNotice tone="warning">{room.unavailableReason}</InlineNotice>
                  ) : null}
                  <div className="mt-2.5 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <strong>{formatRoomPrice(room, filters.hasDates)}</strong>
                    <Button variant={selected ? "primary" : "secondary"} aria-pressed={selected} onClick={() => onSelect(room.id)}>
                      {selected ? "Выбрано" : "Выбрать номер"}
                    </Button>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
                    Заявка отправляется только по этому номеру.
                  </p>
                  <ButtonLink href={requestHrefBuilder(room, filters)} variant="secondary" fullWidth>
                    {cardActionLabel ?? getRoomActionLabel(room)}
                  </ButtonLink>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
