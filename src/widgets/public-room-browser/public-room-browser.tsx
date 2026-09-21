import Image from "next/image";
import Link from "next/link";
import { buildPublicDetailHref } from "@/shared/lib/public-links";
import { DoorOpen, ImageIcon, Scan, Users } from "lucide-react";

import type { PublicRoom, PublicStayFilters } from "@/entities/room";
import { cn, getRussianPluralForm } from "@/shared/lib";
import { formatRubles } from "@/shared/lib/money";
import { AppIcon, InlineNotice } from "@/shared/ui";
import { PublicStayFilter } from "./public-stay-filter";

export { PublicStayFilter } from "./public-stay-filter";

type PublicRoomBrowserProps = {
  publicBaseHref: string;
  rooms: PublicRoom[];
  filters: PublicStayFilters;
  resetHref?: string;
  showFilter?: boolean;
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

export function PublicRoomBrowser({
  publicBaseHref,
  rooms,
  filters,
  resetHref,
  showFilter = true,
  layout = "grid",
}: PublicRoomBrowserProps) {
  const suitableRooms = rooms.filter((room) => room.status === "active" && room.isAvailableForFilter);
  const unsuitableRooms = rooms.filter((room) => room.status === "active" && !room.isAvailableForFilter);
  const resolveDetailHref = (room: PublicRoom, currentFilters: PublicStayFilters) =>
    buildPublicDetailHref(publicBaseHref, "rooms", room.id, currentFilters);

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
        detailHrefBuilder={resolveDetailHref}
        layout={layout}
        hideTitle={layout === "list"}
      />

      {unsuitableRooms.length ? (
        <RoomGrid
          title="Остальные варианты"
          description="Эти номера не подходят хотя бы по одному параметру. Причина указана в карточке."
          filters={filters}
          rooms={unsuitableRooms}
          detailHrefBuilder={resolveDetailHref}
          muted
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
  detailHrefBuilder,
  muted = false,
  layout,
  hideTitle = false,
}: {
  title: string;
  description?: string;
  emptyText?: string;
  filters: PublicStayFilters;
  rooms: PublicRoom[];
  detailHrefBuilder: (room: PublicRoom, filters: PublicStayFilters) => string;
  muted?: boolean;
  layout: "grid" | "list";
  hideTitle?: boolean;
}) {
  const isList = layout === "list";


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
              <Link
                key={room.id}
                href={detailHrefBuilder(room, filters)}
                aria-label={`Подробнее: ${room.title}`}
                className={cn("group rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]", isList
                  ? "grid min-w-0 gap-4 py-5 transition-colors hover:bg-[var(--surface-subtle)] sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8"
                  : "grid overflow-hidden border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_250_/_0.96))] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-[180ms] hover:-translate-y-px", muted && "opacity-95")}
              >
                <div className={isList ? "flex aspect-[16/9] items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] sm:aspect-[3/2]" : "flex min-h-[200px] items-center justify-center overflow-hidden bg-[var(--surface-subtle)]"}>
                  {room.photos[0] ? (
                    <Image
                      src={room.photos[0].url}
                      alt={room.title}
                      width={1200}
                      height={800}
                      unoptimized
                      className={isList ? "h-full w-full object-cover" : "h-full min-h-[200px] w-full object-cover"}
                    />
                  ) : <AppIcon icon={ImageIcon} className="size-10 text-[var(--text-muted)] opacity-50" aria-label="Нет фото" />}
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
                  <div className={isList ? "flex flex-wrap items-center justify-between gap-3 pr-3 lg:grid lg:min-w-44 lg:justify-items-end" : "grid gap-2.5"}>
                  <div className={isList ? "text-lg font-extrabold" : "mt-2.5"}>
                    <strong>{formatRoomPrice(room, filters.hasDates)}</strong>
                  </div>
                  <span className="inline-flex min-h-11 items-center font-semibold text-[var(--accent)] group-hover:underline">Подробнее →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
