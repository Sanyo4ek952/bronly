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
  const roomViewHref = `/dashboard/properties?roomId=${encodeURIComponent(room.id)}#standalone-room-detail`;

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
            <p>Р СѓС‡РЅРѕРµ СѓРїСЂР°РІР»РµРЅРёРµ Р·Р°РЅСЏС‚С‹РјРё РґР°С‚Р°РјРё РґР»СЏ РѕС‚РґРµР»СЊРЅРѕРіРѕ РЅРѕРјРµСЂР°.</p>
          </div>
          <div className="br-room-page__actions">
            <ButtonLink href={`/dashboard/rooms/${room.id}/settings`} variant="secondary">
              РќР°СЃС‚СЂРѕР№РєРё
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>РљР°Р»РµРЅРґР°СЂСЊ Р·Р°РЅСЏС‚РѕСЃС‚Рё</h2>
            <p>РћС‚РјРµС‡Р°Р№С‚Рµ Р·Р°РЅСЏС‚С‹Рµ РґР°С‚С‹ Р±РµР· Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРіРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ Р·Р°СЏРІРѕРє.</p>
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
