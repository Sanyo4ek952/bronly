import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerRoomDetail } from "@/entities/room";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav } from "@/shared/ui";
import { RoomSettingsEditor } from "@/widgets/room-settings-editor/room-settings-editor";

type StandaloneRoomSettingsPageProps = {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StandaloneRoomSettingsPage({ params, searchParams }: StandaloneRoomSettingsPageProps) {
  const { roomId } = await params;
  const room = await getOwnerRoomDetail(roomId);

  if (!room || room.kind !== "standalone_room") {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getRoomsNotice(error, success);
  const roomViewHref = `/dashboard/properties?roomId=${encodeURIComponent(room.id)}#standalone-room-detail`;
  const redirectTo = `/dashboard/rooms/${room.id}/settings`;

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref={roomViewHref}
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: "Отдельные номера", href: "/dashboard/properties" },
          { label: room.title, href: roomViewHref },
          { label: "Настройки" },
        ])}
        compact
      />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <p className="br-owner-muted">{room.location.propertyType}</p>
            <h2>РќР°СЃС‚СЂРѕР№РєРё РѕС‚РґРµР»СЊРЅРѕРіРѕ РЅРѕРјРµСЂР°</h2>
            <p>Р—РґРµСЃСЊ РјРѕР¶РЅРѕ РѕР±РЅРѕРІРёС‚СЊ РґР°РЅРЅС‹Рµ РЅРѕРјРµСЂР°, СЃРµР·РѕРЅРЅС‹Рµ С†РµРЅС‹ Рё С„РѕС‚РѕРіСЂР°С„РёРё.</p>
          </div>
          <div className="br-room-page__actions">
            <ButtonLink href="/dashboard/properties" variant="secondary">Рљ РѕР±С‰РµРјСѓ СЃРїРёСЃРєСѓ</ButtonLink>
          </div>
        </div>
        {notice ? <div className="br-inline-notice">{notice}</div> : null}
      </section>

      <RoomSettingsEditor room={room} redirectTo={redirectTo} />
    </section>
  );
}
