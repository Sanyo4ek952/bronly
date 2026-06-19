import { mapBusyRange } from "@/entities/room/model/mappers";
import type { OwnerCalendarInventoryGroup, OwnerCalendarInventoryRoom } from "@/entities/property/model/types";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import type { SupabasePropertyRow, SupabaseRoomBusyRangeRow, SupabaseRoomRow } from "@/shared/api/supabase/types";

function buildPropertyRoomCalendarHref(propertyId: string) {
  return `/dashboard/properties/${propertyId}/calendar`;
}

function buildStandaloneRoomCalendarHref(roomId: string) {
  return `/dashboard/rooms/${roomId}/calendar`;
}

export async function getOwnerCalendarInventory(): Promise<OwnerCalendarInventoryGroup[]> {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: propertyRows }, { data: roomRows }] = await Promise.all([
    supabase.from("properties").select("*").eq("owner_id", profile.id).order("created_at", { ascending: true }),
    supabase.from("rooms").select("*").eq("owner_id", profile.id).order("created_at", { ascending: true }),
  ]);

  const safePropertyRows = (propertyRows ?? []) as SupabasePropertyRow[];
  const safeRoomRows = (roomRows ?? []) as SupabaseRoomRow[];
  const roomIds = safeRoomRows.map((room) => room.id);

  const busyRows = roomIds.length
    ? (
        await supabase
          .from("room_busy_ranges")
          .select("*")
          .in("room_id", roomIds)
          .order("starts_on", { ascending: true })
      ).data ?? []
    : [];

  const busyMap = new Map<string, OwnerCalendarInventoryRoom["busyRanges"]>();

  for (const row of busyRows as SupabaseRoomBusyRangeRow[]) {
    const current = busyMap.get(row.room_id) ?? [];
    current.push(mapBusyRange(row));
    busyMap.set(row.room_id, current);
  }

  const propertyGroups: OwnerCalendarInventoryGroup[] = safePropertyRows.map((property) => {
    const rooms = safeRoomRows
      .filter((room) => room.property_id === property.id)
      .map<OwnerCalendarInventoryRoom>((room) => ({
        id: room.id,
        kind: room.room_kind,
        propertyId: property.id,
        title: room.title,
        subtitle: room.subtitle ?? "",
        pricePerNight: Number(room.price_per_night),
        busyRanges: busyMap.get(room.id) ?? [],
        calendarHref: buildPropertyRoomCalendarHref(property.id),
      }));

    return {
      kind: "property",
      id: property.id,
      title: property.title,
      subtitle: `${property.city}, ${property.address}`,
      rooms,
      detailHref: `/dashboard/properties/${property.id}`,
      calendarHref: buildPropertyRoomCalendarHref(property.id),
    };
  });

  const standaloneRooms = safeRoomRows
    .filter((room) => room.room_kind === "standalone_room")
    .map<OwnerCalendarInventoryRoom>((room) => ({
      id: room.id,
      kind: room.room_kind,
      propertyId: null,
      title: room.title,
      subtitle: room.subtitle ?? "",
      pricePerNight: Number(room.price_per_night),
      busyRanges: busyMap.get(room.id) ?? [],
      calendarHref: buildStandaloneRoomCalendarHref(room.id),
    }));

  if (!standaloneRooms.length) {
    return propertyGroups;
  }

  return [
    ...propertyGroups,
    {
      kind: "standalone",
      id: "standalone",
      title: "Отдельные номера",
      subtitle: "Номера без объекта в общем календаре кабинета.",
      rooms: standaloneRooms,
    },
  ];
}
