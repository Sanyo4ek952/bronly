import { notFound } from "next/navigation";

import { getCalendarNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerRoomDetail } from "@/entities/room/api/owner-room-detail";
import { buildOwnerInventoryBreadcrumbs, formatRubles } from "@/shared/lib";
import { ButtonLink, DashboardPageNav, InlineNotice, Panel, StatusPill } from "@/shared/ui";
import { AdminPageHeader, ObjectStats } from "@/widgets/property-admin";
import { OwnerCalendarBrowser } from "@/widgets/owner-calendar-browser/owner-calendar-browser";

type StandaloneRoomCalendarPageProps = {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid min-w-0 gap-6 max-[720px]:gap-5";

export default async function StandaloneRoomCalendarPage({ params, searchParams }: StandaloneRoomCalendarPageProps) {
  const { roomId } = await params;
  const room = await getOwnerRoomDetail(roomId);

  if (!room || room.kind !== "standalone_room") {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getCalendarNotice(error, success);
  const roomViewHref = `/dashboard/rooms/${room.id}`;
  const roomDescription = [room.title, [room.location.city, room.location.address].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className={pageStackClass}>
      <DashboardPageNav
        backHref={roomViewHref}
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: "Отдельные номера", href: "/dashboard/properties" },
          { label: room.title, href: roomViewHref },
          { label: "Календарь занятости" },
        ])}
        compact
      />

      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Отдельный номер</p>
          <StatusPill variant={room.isActive ? "active" : "inactive"}>{room.isActive ? "Опубликован" : "В архиве"}</StatusPill>
        </div>
        <AdminPageHeader
          variant="plain"
          title="Календарь номера"
          description={roomDescription}
          actions={<ButtonLink href={`/dashboard/rooms/${room.id}/settings`} variant="secondary">Настройки</ButtonLink>}
        />
      </div>

      {notice ? <InlineNotice tone={error ? "error" : "default"}>{notice}</InlineNotice> : null}

      <Panel padding="md" aria-label="Сводка по номеру">
        <ObjectStats
          compact
          stackOnMobile={false}
          items={[
            { label: "Базовая цена", value: formatRubles(room.pricePerNight) },
            { label: "Занятые диапазоны", value: String(room.busyRanges.length), tone: "accent" },
            { label: "Фото", value: String(room.photos.length) },
          ]}
        />
      </Panel>

      <section className="grid min-w-0 gap-4" aria-labelledby="standalone-room-calendar-title">
        <div className="grid gap-1.5">
          <h2 id="standalone-room-calendar-title" className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Занятые даты</h2>
          <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
            Отмечайте недоступные периоды вручную. Это не подтверждает заявку на проживание автоматически.
          </p>
        </div>

        <OwnerCalendarBrowser
          rooms={[
            {
              id: room.id,
              title: room.title,
              pricePerNight: room.pricePerNight,
              busyRanges: room.busyRanges,
            },
          ]}
        />
      </section>
    </section>
  );
}
