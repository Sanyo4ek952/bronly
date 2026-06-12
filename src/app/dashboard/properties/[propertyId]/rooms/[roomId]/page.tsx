import { notFound } from "next/navigation";

import { getOwnerPropertyDetail } from "@/entities/property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { RoomDetailPage } from "@/widgets/room-detail-page/room-detail-page";

type PropertyRoomPageProps = {
  params: Promise<{ propertyId: string; roomId: string }>;
};

export default async function PropertyRoomPage({ params }: PropertyRoomPageProps) {
  const { propertyId, roomId } = await params;
  const property = await getOwnerPropertyDetail(propertyId);

  if (!property) {
    notFound();
  }

  const room = property.rooms.find((item) => item.id === roomId);

  if (!room) {
    notFound();
  }

  return (
    <RoomDetailPage
      room={room}
      title={room.title}
      intro="Страница номера с фотографиями, описанием, удобствами и переходом в настройки."
      backHref={`/dashboard/properties/${property.id}/rooms`}
      breadcrumbs={buildOwnerInventoryBreadcrumbs([
        { label: property.title, href: `/dashboard/properties/${property.id}` },
        { label: "Номера", href: `/dashboard/properties/${property.id}/rooms` },
        { label: room.title },
      ])}
      settingsHref={`/dashboard/properties/${property.id}/rooms/${room.id}/settings`}
      calendarHref={`/dashboard/properties/${property.id}/calendar`}
      propertyLabel={property.title}
      calendarSummaryText="Занятые даты по этому номеру управляются в общем календаре объекта, а сезонные цены доступны в настройках номера."
      listHref={`/dashboard/properties/${property.id}/rooms`}
      listLabel="К списку номеров"
    />
  );
}
