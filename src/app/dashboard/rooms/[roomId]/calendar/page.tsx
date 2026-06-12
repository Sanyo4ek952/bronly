import { notFound } from "next/navigation";

import { getCalendarNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerRoomDetail } from "@/entities/room";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav } from "@/shared/ui";
import { OwnerCalendarBrowser } from "@/widgets/owner-calendar-browser/owner-calendar-browser";

type StandaloneRoomCalendarPageProps = {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref={roomViewHref}
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: "Отдельные номера", href: "/dashboard/properties" },
          { label: room.title, href: roomViewHref },
          { label: "Календарь занятости" },
        ])}
        compact
      />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>{room.title}</h2>
            <p>Ручное управление занятыми датами для отдельного номера.</p>
          </div>
          <div className="br-room-page__actions">
            <ButtonLink href={`/dashboard/rooms/${room.id}/settings`} variant="secondary">
              Настройки
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Календарь занятости</h2>
            <p>Отмечайте занятые даты без автоматического подтверждения заявок.</p>
          </div>
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
          serverNotice={notice}
        />
      </section>
    </section>
  );
}
