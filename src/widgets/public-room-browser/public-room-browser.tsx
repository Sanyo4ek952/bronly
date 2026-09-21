"use client";

import Image from "next/image";
import { useId } from "react";
import { DoorOpen, ImageIcon, Scan, Users } from "lucide-react";

import type { PublicRoom, PublicStayFilters } from "@/entities/room";
import { cn, getRussianPluralForm } from "@/shared/lib";
import { formatRubles } from "@/shared/lib/money";
import { AppIcon, Button, ButtonLink, InlineNotice, Input, Panel, Select } from "@/shared/ui";

type PublicStayFilterProps = {
  publicBaseHref: string;
  filters: PublicStayFilters;
  resetHref?: string;
  variant?: "default" | "inline";
};

type PublicRoomBrowserProps = {
  publicBaseHref: string;
  propertySlug?: string;
  rooms: PublicRoom[];
  filters: PublicStayFilters;
  resetHref?: string;
  showFilter?: boolean;
  cardActionLabel?: string;
  layout?: "grid" | "list";
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

export function PublicStayFilter({ publicBaseHref, filters, resetHref, variant = "default" }: PublicStayFilterProps) {
  const filterId = useId();
  const inline = variant === "inline";

  return (
    <div className="grid gap-[18px]">
      <form
        method="get"
        aria-label="Параметры проживания"
        className={inline
          ? "grid grid-cols-2 items-end gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] [&_input]:min-h-11 [&_input]:min-w-0"
          : "grid items-end gap-[14px] rounded-[var(--radius-lg)] border border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(220px,280px)]"}
      >
        <Input id={`${filterId}-check-in`} name="checkIn" type="date" label="Заезд" defaultValue={filters.checkIn} />
        <Input id={`${filterId}-check-out`} name="checkOut" type="date" label="Выезд" defaultValue={filters.checkOut} />
        <Select
          id={`${filterId}-adults`}
          name="adults"
          label="Гости"
          className={inline ? "!border !border-solid !border-[var(--border)]" : undefined}
          defaultValue={String(filters.adults)}
          options={Array.from({ length: 8 }, (_, index) => {
            const value = String(index + 1);
            return { value, label: inline ? `${value} ${getRussianPluralForm(index + 1, ["гость", "гостя", "гостей"])}` : value };
          })}
        />
        <Select
          id={`${filterId}-rooms`}
          name="rooms"
          label="Комнаты"
          className={inline ? "!border !border-solid !border-[var(--border)]" : undefined}
          defaultValue={String(filters.rooms)}
          options={Array.from({ length: 5 }, (_, index) => {
            const value = String(index + 1);
            return { value, label: inline ? `${value} ${getRussianPluralForm(index + 1, ["комната", "комнаты", "комнат"])}` : value };
          })}
        />
        <div className={inline ? "col-span-2 flex items-center gap-3 lg:col-span-1" : "grid gap-2.5"}>
          <Button type="submit" fullWidth className={inline ? "min-h-11 flex-1 whitespace-nowrap lg:min-w-44" : undefined}>
            Подобрать номера
          </Button>
          <ButtonLink href={resetHref ?? publicBaseHref} variant={inline ? "ghost" : "secondary"} fullWidth={!inline} className={inline ? "min-h-11 underline underline-offset-4" : undefined}>
            Сбросить
          </ButtonLink>
        </div>
      </form>

      {filters.hasDates && inline ? (
        <p className="text-sm text-[var(--text-muted)]">Показаны варианты с {filters.checkIn} по {filters.checkOut}. Итоговая сумма рассчитана по ночам.</p>
      ) : filters.hasDates ? (
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
  layout = "grid",
}: PublicRoomBrowserProps) {
  const suitableRooms = rooms.filter((room) => room.isAvailableForFilter);
  const unsuitableRooms = rooms.filter((room) => !room.isAvailableForFilter);
  const resolveRequestHref = (room: PublicRoom, currentFilters: PublicStayFilters) =>
    buildPublicRequestHref(publicBaseHref, propertySlug, room, currentFilters);

  return (
    <div className="grid gap-6">
      {showFilter ? (
        <PublicStayFilter publicBaseHref={publicBaseHref} filters={filters} resetHref={resetHref} variant={layout === "list" ? "inline" : "default"} />
      ) : null}

      <RoomGrid
        title="Подходящие номера"
        emptyText="По выбранным параметрам подходящих номеров нет. Ниже показаны остальные варианты."
        filters={filters}
        rooms={suitableRooms}
        requestHrefBuilder={resolveRequestHref}
        cardActionLabel={cardActionLabel}
        layout={layout}
        hideTitle={layout === "list"}
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
          layout={layout}
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
  layout,
  hideTitle = false,
}: {
  title: string;
  description?: string;
  emptyText?: string;
  filters: PublicStayFilters;
  rooms: PublicRoom[];
  requestHrefBuilder: (room: PublicRoom, filters: PublicStayFilters) => string;
  muted?: boolean;
  cardActionLabel?: string;
  layout: "grid" | "list";
  hideTitle?: boolean;
}) {
  const isList = layout === "list";
  const Card = isList ? "article" : Panel;

  return (
    <section className="grid gap-4" aria-label={hideTitle ? title : undefined}>
      {!hideTitle || !rooms.length ? <div className="grid gap-2">
        {!hideTitle ? <h3 className={isList ? "text-base font-bold" : "text-2xl font-extrabold leading-tight"}>{title}</h3> : null}
        {description ? <p className="text-sm leading-relaxed text-[var(--text-muted)]">{description}</p> : null}
        {emptyText && !rooms.length ? <p className="text-sm leading-relaxed text-[var(--text-muted)]">{emptyText}</p> : null}
      </div> : null}
      {rooms.length ? (
        <div className={isList ? "grid divide-y divide-[var(--border)] border-y border-[var(--border)]" : "grid gap-[18px] min-[721px]:grid-cols-2 xl:grid-cols-3"}>
          {rooms.map((room) => {
            const location = formatLocation(room);

            return (
              <Card
                key={room.id}
                {...(!isList ? { as: "article" as const, padding: "none" as const } : {})}
                className={cn(isList
                  ? "grid min-w-0 gap-4 py-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8"
                  : "grid overflow-hidden border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_250_/_0.96))] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-[180ms] hover:-translate-y-px", muted && "opacity-95")}
              >
                <div className={isList ? "flex aspect-[16/9] items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] sm:aspect-[3/2]" : "min-h-[200px] overflow-hidden bg-[linear-gradient(135deg,#d7eae6_0%,#c3ddd9_42%,#f0e0ce_100%)]"}>
                  {room.photos[0] ? (
                    <Image
                      src={room.photos[0].url}
                      alt={room.title}
                      width={1200}
                      height={800}
                      unoptimized
                      className={isList ? "h-full w-full object-cover" : "h-full min-h-[200px] w-full object-cover"}
                    />
                  ) : isList ? <AppIcon icon={ImageIcon} className="size-10 text-[var(--text-muted)] opacity-50" aria-label="Нет фото" /> : null}
                </div>
                <div className={isList ? "grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6" : "grid gap-2.5 p-[18px]"}>
                  <div className="grid min-w-0 gap-2.5">
                  {room.propertyTitle && !isList ? (
                    <span className="inline-flex min-h-8 w-fit items-center rounded-full bg-[rgb(var(--color-primary-rgb)_/_0.10)] px-3 text-xs font-bold text-[var(--color-primary-hover)]">
                      {room.propertyTitle}
                    </span>
                  ) : null}
                  <strong className="text-lg leading-tight [overflow-wrap:anywhere]">{isList && /^\d+$/.test(room.title.trim()) ? `Номер ${room.title}` : room.title}</strong>
                  {location ? <span className="text-[13px] leading-relaxed text-[var(--text-muted)] [overflow-wrap:anywhere]">{location}</span> : null}
                  {isList ? (
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-2"><AppIcon icon={Users} className="size-4" aria-hidden="true" />{room.capacity} {getRussianPluralForm(room.capacity, ["гость", "гостя", "гостей"])}</span>
                      <span className="inline-flex items-center gap-2"><AppIcon icon={DoorOpen} className="size-4" aria-hidden="true" />{room.bedrooms} {getRussianPluralForm(room.bedrooms, ["комната", "комнаты", "комнат"])}</span>
                      {room.area > 0 ? <span className="inline-flex items-center gap-2"><AppIcon icon={Scan} className="size-4" aria-hidden="true" />{room.area} м²</span> : null}
                    </div>
                  ) : <span className="text-sm text-[var(--text-muted)]">{formatRoomMeta(room)}</span>}
                  {!room.isAvailableForFilter && room.unavailableReason ? (
                    isList ? <p className="text-sm text-[var(--color-warning-ink)]">{room.unavailableReason}</p> : <InlineNotice tone="warning">{room.unavailableReason}</InlineNotice>
                  ) : null}
                  </div>
                  <div className={isList ? "flex flex-wrap items-center justify-between gap-3 lg:grid lg:min-w-44 lg:justify-items-end" : "grid gap-2.5"}>
                  <div className={isList ? "text-lg font-extrabold" : "mt-2.5"}>
                    <strong>{formatRoomPrice(room, filters.hasDates)}</strong>
                  </div>
                  {!isList ? <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
                    Заявка отправляется только по этому номеру.
                  </p> : null}
                  <ButtonLink href={requestHrefBuilder(room, filters)} variant={isList && !muted ? "primary" : "secondary"} fullWidth={!isList} className={isList ? "min-h-11 w-full sm:w-auto lg:min-w-44" : undefined}>
                    {cardActionLabel ?? getRoomActionLabel(room)}
                  </ButtonLink>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
