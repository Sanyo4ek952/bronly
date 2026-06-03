import { cache } from "react";

import type { PublicPropertyPageData } from "@/entities/property/model/types";
import { formatRequestStatus, guestRequests } from "@/entities/request/model/mock";
import type { AgentRequestItem, OwnerRequestItem } from "@/entities/request/model/types";
import {
  calculateRoomPricing,
  isRoomAvailableForDates,
  normalizePublicStayFilters,
} from "@/entities/room";
import { getRoomById } from "@/entities/room/model/mock";
import { mapBusyRange, mapSeasonalPrice } from "@/entities/room/model/mappers";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { createSupabaseServerClient } from "@/shared/api/supabase/server-auth";
import type {
  SupabaseGuestRequestRow,
  SupabaseRoomBusyRangeRow,
  SupabaseRoomSeasonalPriceRow,
} from "@/shared/api/supabase/types";
import { formatDateLabel, formatDateTimeLabel } from "@/shared/lib/date";

function formatFullGuestLabel(adultsCount: number, childrenCount: number) {
  const parts = [`${adultsCount} взр.`];

  if (childrenCount > 0) {
    parts.push(`${childrenCount} дет.`);
  }

  return parts.join(", ");
}


function mapRequestStatus(status: SupabaseGuestRequestRow["status"]): OwnerRequestItem["status"] {
  switch (status) {
    case "owner_confirmed":
    case "completed":
      return "confirmed";
    default:
      return status;
  }
}

export const getOwnerRequests = cache(async (): Promise<OwnerRequestItem[]> => {
  if (!canUseSupabase()) {
    return guestRequests;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: requestRows } = await supabase
      .from("guest_requests")
      .select("*")
      .order("created_at", { ascending: false });

    return ((requestRows ?? []) as SupabaseGuestRequestRow[]).map((request) => ({
      id: request.id,
      guestName: request.guest_name,
      phone: request.guest_phone,
      createdAt: formatDateTimeLabel(request.created_at),
      roomId: request.room_id,
      status: mapRequestStatus(request.status),
      checkIn: formatDateLabel(request.check_in),
      checkOut: formatDateLabel(request.check_out),
      guestsLabel: formatFullGuestLabel(request.adults_count, request.children_count),
      comment: request.guest_comment ?? "",
      totalPrice: Number(request.total_price ?? request.base_price_per_night ?? 0),
    }));
  } catch {
    return guestRequests;
  }
});

export async function createGuestRequest(input: {
  propertySlug: string;
  roomId: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  adultsCount: number;
  guestComment: string;
}) {
  if (!canUseSupabase()) {
    return { ok: true, mode: "mock" as const };
  }

  const filters = normalizePublicStayFilters({
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adultsCount,
  });

  if (!filters.hasDates) {
    return { ok: false, reason: "validation_failed" as const };
  }

  const supabase = createSupabaseAdminClient();
  const { data: propertyData } = await supabase
    .from("properties")
    .select("id, owner_id, published, is_frozen")
    .eq("slug", input.propertySlug)
    .maybeSingle();

  const propertyRow = propertyData as {
    id: string;
    owner_id: string;
    published: boolean;
    is_frozen: boolean;
  } | null;

  if (!propertyRow || !propertyRow.published || propertyRow.is_frozen) {
    return { ok: false, reason: "property_not_found" as const };
  }

  const subscription = await getSubscriptionRuntimeState(propertyRow.owner_id, "owner");

  if (!subscription.isRequestIntakeAllowed) {
    return { ok: false, reason: "subscription_expired" as const };
  }

  const { data: roomData } = await supabase
    .from("rooms")
    .select("id, price_per_night, capacity, bedrooms, is_active")
    .eq("id", input.roomId)
    .eq("property_id", propertyRow.id)
    .maybeSingle();

  const roomRow = roomData as {
    id: string;
    price_per_night: number;
    capacity: number;
    bedrooms: number;
    is_active: boolean;
  } | null;

  if (!roomRow || !roomRow.is_active) {
    return { ok: false, reason: "room_not_found" as const };
  }

  if (roomRow.capacity < filters.adults) {
    return { ok: false, reason: "room_not_suitable" as const };
  }

  const [{ data: seasonalRows }, { data: busyRows }] = await Promise.all([
    supabase
      .from("room_seasonal_prices")
      .select("*")
      .eq("room_id", roomRow.id)
      .eq("is_active", true)
      .order("starts_on", { ascending: true }),
    supabase
      .from("room_busy_ranges")
      .select("*")
      .eq("room_id", roomRow.id)
      .order("starts_on", { ascending: true }),
  ]);

  const seasonalPrices = ((seasonalRows ?? []) as SupabaseRoomSeasonalPriceRow[]).map(mapSeasonalPrice);
  const busyRanges = ((busyRows ?? []) as SupabaseRoomBusyRangeRow[]).map(mapBusyRange);

  if (!isRoomAvailableForDates({ busyRanges }, filters.checkIn, filters.checkOut)) {
    return { ok: false, reason: "availability_failed" as const };
  }

  const basePricePerNight = Number(roomRow.price_per_night);
  const pricing = calculateRoomPricing(
    {
      id: roomRow.id,
      pricePerNight: basePricePerNight,
      capacity: roomRow.capacity,
      bedrooms: roomRow.bedrooms,
      seasonalPrices,
      busyRanges,
    },
    filters.checkIn,
    filters.checkOut,
  );

  const { error } = await supabase.from("guest_requests").insert({
    source: "owner",
    property_id: propertyRow.id,
    room_id: roomRow.id,
    owner_id: propertyRow.owner_id,
    guest_name: input.guestName,
    guest_phone: input.guestPhone,
    guest_comment: input.guestComment,
    adults_count: filters.adults,
    children_count: 0,
    check_in: filters.checkIn,
    check_out: filters.checkOut,
    status: "new",
    base_price_per_night: basePricePerNight,
    total_price: pricing.totalPrice,
    pricing_snapshot: {
      source: "owner",
      room_id: roomRow.id,
      check_in: filters.checkIn,
      check_out: filters.checkOut,
      adults_count: filters.adults,
      nights: pricing.nights,
      base_price_per_night: basePricePerNight,
      display_price_per_night: pricing.displayPricePerNight,
      total_price: pricing.totalPrice,
      nightly_prices: pricing.nightlyPrices,
    },
  });

  if (error) {
    return { ok: false, reason: "save_failed" as const };
  }

  return { ok: true, mode: "supabase" as const };
}

export function getRequestRoom(roomId: string) {
  return getRoomById(roomId);
}

export function getFallbackRequestStatus(status: OwnerRequestItem["status"]) {
  return formatRequestStatus(status);
}

export async function getAgentRequests(profile: { id: string }): Promise<AgentRequestItem[]> {
  if (!canUseSupabase()) {
    return [];
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("guest_requests")
      .select("id, guest_name, status, created_at, properties(title)")
      .eq("agent_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return (data ?? []).map((item) => ({
      id: item.id as string,
      propertyTitle: ((item.properties as { title?: string } | null)?.title ?? "Объект"),
      guestName: item.guest_name as string,
      createdAt: formatDateTimeLabel(item.created_at as string),
      status:
        item.status === "completed"
          ? "Завершена"
          : item.status === "owner_confirmed"
            ? "Принята владельцем"
            : item.status === "in_progress"
              ? "В работе"
              : item.status === "declined"
                ? "Отклонена"
                : "Новая",
    }));
  } catch {
    return [];
  }
}

export type { PublicPropertyPageData };
