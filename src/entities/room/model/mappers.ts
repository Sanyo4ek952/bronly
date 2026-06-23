import type { OwnerBusyRange, OwnerSeasonalPrice } from "@/entities/room/model/types";
import type { SupabaseRoomBusyRangeRow, SupabaseRoomSeasonalPriceRow } from "@/shared/api/supabase/types";

export function mapSeasonalPrice(row: SupabaseRoomSeasonalPriceRow): OwnerSeasonalPrice {
  return {
    id: row.id,
    roomId: row.room_id,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    pricePerNight: Number(row.price_per_night),
    isActive: row.is_active,
  };
}

export function mapBusyRange(row: SupabaseRoomBusyRangeRow): OwnerBusyRange {
  return {
    id: row.id,
    roomId: row.room_id,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    source: row.source,
    label: row.label ?? "",
    note: row.note ?? "",
  };
}
