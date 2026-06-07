import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { ButtonLink } from "@/shared/ui";
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
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <p className="br-owner-muted">{property.title}</p>
            <h2>Настройки номера</h2>
            <p>Здесь можно обновить данные номера, сезонные цены и фотографии.</p>
          </div>
          <div className="br-room-page__actions">
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms/${room.id}`} variant="secondary">
              К странице номера
            </ButtonLink>
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms`} variant="secondary">
              К списку номеров
            </ButtonLink>
          </div>
        </div>

        {notice ? <div className="br-inline-notice">{notice}</div> : null}
      </section>

      <RoomSettingsEditor propertyId={property.id} room={room} redirectTo={redirectTo} />
    </section>
  );
}
