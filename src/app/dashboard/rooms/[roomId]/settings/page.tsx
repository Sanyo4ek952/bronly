import { notFound } from "next/navigation";

import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerRoomDetail } from "@/entities/room";
import { ButtonLink } from "@/shared/ui";
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
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <p className="br-owner-muted">{room.location.propertyType}</p>
            <h2>Настройки отдельного номера</h2>
            <p>Здесь можно обновить данные номера, сезонные цены и фотографии.</p>
          </div>
          <div className="br-room-page__actions">
            <ButtonLink href={roomViewHref} variant="secondary">К карточке номера</ButtonLink>
            <ButtonLink href="/dashboard/properties" variant="secondary">К общему списку</ButtonLink>
          </div>
        </div>
        {notice ? <div className="br-inline-notice">{notice}</div> : null}
      </section>

      <RoomSettingsEditor room={room} redirectTo={redirectTo} />
    </section>
  );
}
