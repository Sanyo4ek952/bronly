import { notFound } from "next/navigation";

import { getOwnerRoomDetail } from "@/entities/room";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { RoomDetailPage } from "@/widgets/room-detail-page/room-detail-page";

type StandaloneRoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function StandaloneRoomPage({ params }: StandaloneRoomPageProps) {
  const { roomId } = await params;
  const room = await getOwnerRoomDetail(roomId);

  if (!room || room.kind !== "standalone_room") {
    notFound();
  }

  return (
    <RoomDetailPage
      room={room}
      title={room.title}
      intro="Страница номера с фотографиями, описанием, удобствами и переходом в настройки."
      backHref="/dashboard/properties"
      breadcrumbs={buildOwnerInventoryBreadcrumbs([
        { label: "Отдельные номера", href: "/dashboard/properties" },
        { label: room.title },
      ])}
      settingsHref={`/dashboard/rooms/${room.id}/settings`}
      calendarHref={`/dashboard/rooms/${room.id}/calendar`}
      calendarCtaLabel="Календарь занятости"
      calendarSummaryText="Сезонные цены и календарь занятости остаются отдельными сущностями, но видны здесь для быстрого контроля."
      listHref="/dashboard/properties"
      listLabel="К общему списку"
    />
  );
}
