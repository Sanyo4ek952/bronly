import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { ButtonLink, DashboardPageNav } from "@/shared/ui";
import { RoomSettingsEditor } from "@/widgets/room-settings-editor/room-settings-editor";

type PropertyRoomSettingsPageProps = {
  params: Promise<{ propertyId: string; roomId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertyRoomSettingsPage({ params, searchParams }: PropertyRoomSettingsPageProps) {
  const { propertyId, roomId } = await params;
  const property = await getOwnerPropertyDetail(propertyId);

  if (!property) {
    notFound();
  }

  const room = property.rooms.find((item) => item.id === roomId);

  if (!room) {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getRoomsNotice(error, success);
  const redirectTo = `/dashboard/properties/${property.id}/rooms/${room.id}/settings`;

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref={`/dashboard/properties/${property.id}/rooms/${room.id}`}
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: property.title, href: `/dashboard/properties/${property.id}` },
          { label: "Номера", href: `/dashboard/properties/${property.id}/rooms` },
          { label: room.title, href: `/dashboard/properties/${property.id}/rooms/${room.id}` },
          { label: "Настройки" },
        ])}
        compact
      />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <p className="br-owner-muted">{property.title}</p>
            <h2>РќР°СЃС‚СЂРѕР№РєРё РЅРѕРјРµСЂР°</h2>
            <p>Р—РґРµСЃСЊ РјРѕР¶РЅРѕ РѕР±РЅРѕРІРёС‚СЊ РґР°РЅРЅС‹Рµ РЅРѕРјРµСЂР°, СЃРµР·РѕРЅРЅС‹Рµ С†РµРЅС‹ Рё С„РѕС‚РѕРіСЂР°С„РёРё.</p>
          </div>
          <div className="br-room-page__actions">
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms`} variant="secondary">
              Рљ СЃРїРёСЃРєСѓ РЅРѕРјРµСЂРѕРІ
            </ButtonLink>
          </div>
        </div>

        {notice ? <div className="br-inline-notice">{notice}</div> : null}
      </section>

      <RoomSettingsEditor propertyId={property.id} room={room} redirectTo={redirectTo} />
    </section>
  );
}
