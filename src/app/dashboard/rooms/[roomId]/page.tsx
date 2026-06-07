import { notFound, redirect } from "next/navigation";

import { getOwnerRoomDetail } from "@/entities/room";

type StandaloneRoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function StandaloneRoomPage({ params }: StandaloneRoomPageProps) {
  const { roomId } = await params;
  const room = await getOwnerRoomDetail(roomId);

  if (!room || room.kind !== "standalone_room") {
    notFound();
  }

  redirect(`/dashboard/properties?roomId=${encodeURIComponent(room.id)}#standalone-room-detail`);
}
