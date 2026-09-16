"use client";

import Image from "next/image";
import { useId } from "react";

import type { PublicRoom, PublicStayFilters } from "@/entities/room";
import { formatRubles } from "@/shared/lib/money";
import { Button, ButtonLink, InlineNotice, Input, Panel, Select } from "@/shared/ui";

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
  cardActionLabel,
}: PublicRoomBrowserProps) {
  const suitableRooms = rooms.filter((room) => room.isAvailableForFilter);
  const unsuitableRooms = rooms.filter((room) => !room.isAvailableForFilter);
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
        requestHrefBuilder={resolveRequestHref}
        cardActionLabel={cardActionLabel}
      />

      {unsuitableRooms.length ? (
        <RoomGrid
          title="Остальные варианты"
          description="Эти номера не подходят хотя бы по одному параметру. Причина указана в карточке."
          filters={filters}
          rooms={unsuitableRooms}
          requestHrefBuilder={resolveRequestHref}
          muted
          cardActionLabel={cardActionLabel}
        />
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
  requestHrefBuilder,
  muted = false,
  cardActionLabel,
}: {
  title: string;
  description?: string;
  emptyText?: string;
  filters: PublicStayFilters;
  rooms: PublicRoom[];
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

            return (
              <Panel
                key={room.id}
                as="article"
                className={`grid overflow-hidden border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_250_/_0.96))] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-[180ms] hover:-translate-y-px ${muted ? "opacity-95" : ""}`}
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
                  <div className="mt-2.5">
                    <strong>{formatRoomPrice(room, filters.hasDates)}</strong>
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
