import { buildPropertyPhotoMap, buildRoomPhotoMap, withLegacyPropertyCover } from "@/entities/property/api/photo-utils";
import type {
  OwnerInventoryDashboardData,
  OwnerInventoryDashboardItem,
  OwnerInventoryDashboardStatus,
  PropertyPhoto,
} from "@/entities/property/model/types";
import {
  buildInventoryCompletion,
  buildInventoryPublicLabel,
  getMinimumActiveRoomPrice,
} from "@/entities/property/model/inventory-dashboard";
import { getCanonicalAppUrl } from "@/shared/api/supabase/env";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import { logServerDataError } from "@/shared/api/supabase/server-diagnostics";
import type {
  SupabaseAgentPropertyLinkRow,
  SupabaseAgentRoomLinkRow,
  SupabaseGuestRequestRow,
  SupabasePropertyPhotoRow,
  SupabasePropertyRow,
  SupabaseRoomPhotoRow,
  SupabaseRoomRow,
} from "@/shared/api/supabase/types";

type PropertyRoomRow = Pick<
  SupabaseRoomRow,
  | "id"
  | "property_id"
  | "title"
  | "price_per_night"
  | "is_active"
  | "short_description"
  | "full_description"
  | "allow_agent_inquiries"
>;

function getPublicHref(slug: string | null) {
  return slug ? `/p/${slug}` : null;
}

function getPropertyStatus(row: SupabasePropertyRow): { status: OwnerInventoryDashboardStatus; label: string } {
  if (row.is_frozen) {
    return { status: "archived", label: "Архив" };
  }

  if (row.published) {
    return { status: "published", label: "Опубликован" };
  }

  return { status: "draft", label: "Черновик" };
}

function getStandaloneStatus(row: SupabaseRoomRow): { status: OwnerInventoryDashboardStatus; label: string } {
  if (row.is_active) {
    return { status: "published", label: "Опубликован" };
  }

  return { status: "draft", label: "Черновик" };
}

function shouldCountRequestAsNew(request: Pick<SupabaseGuestRequestRow, "status" | "source" | "agent_id" | "owner_id">) {
  const isAgentMediated =
    Boolean(request.agent_id) &&
    request.agent_id !== request.owner_id &&
    (request.source === "agent" || request.source === "collection");

  return request.status === "new" && !isAgentMediated;
}

function countById(rows: Array<{ id: string }>) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.id, (counts.get(row.id) ?? 0) + 1);
  }

  return counts;
}

function failOwnerInventoryRead(event: string, error: unknown): never {
  logServerDataError(event, error);
  throw new Error("Owner inventory data is unavailable.");
}

function mapPropertyDashboardItem(input: {
  row: SupabasePropertyRow;
  ownerPublicSlug: string | null;
  appUrl: string | undefined;
  photos: PropertyPhoto[];
  roomRows: PropertyRoomRow[];
  propertyFeatureCount: number;
  propertyRuleCount: number;
  roomAmenityCount: number;
  newRequestsCount: number;
  activeCollaborationsCount: number;
}): OwnerInventoryDashboardItem {
  const status = getPropertyStatus(input.row);
  const roomCount = input.roomRows.length;
  const activeRoomCount = input.roomRows.filter((room) => room.is_active).length;
  const minPrice = getMinimumActiveRoomPrice(input.roomRows.map((room) => ({
    isActive: room.is_active,
    pricePerNight: room.price_per_night,
  })));
  const hasDescription = Boolean(input.row.short_description?.trim() || input.row.full_description?.trim());
  const hasPhotos = input.photos.length > 0;
  const hasAmenitiesAndServices = input.propertyFeatureCount + input.propertyRuleCount + input.roomAmenityCount > 0;
  const hasRooms = roomCount > 0;
  const hasPrices = input.roomRows.some((room) => Number(room.price_per_night ?? 0) > 0);
  const { completenessPercent, completionBreakdown } = buildInventoryCompletion({
    hasDescription,
    hasPhotos,
    hasAmenitiesAndServices,
    hasRooms,
    hasPrices,
  });

  return {
    id: input.row.id,
    kind: "property",
    ownerPublicSlug: input.ownerPublicSlug,
    title: input.row.title,
    shortTitle: input.row.short_title,
    propertyType: input.row.property_type,
    city: input.row.city,
    address: input.row.address,
    coverImageUrl: input.photos[0]?.url ?? input.row.cover_image_url ?? "",
    publicHref: getPublicHref(input.ownerPublicSlug),
    publicLabel: buildInventoryPublicLabel(input.ownerPublicSlug, input.appUrl),
    status: status.status,
    statusLabel: status.label,
    roomCount,
    activeRoomCount,
    newRequestsCount: input.newRequestsCount,
    minPrice,
    activeCollaborationsCount: input.activeCollaborationsCount,
    allowAgentInquiries: input.row.allow_agent_inquiries,
    completenessPercent,
    completionBreakdown,
    createdAt: input.row.created_at,
    updatedAt: input.row.updated_at,
  };
}

function mapStandaloneDashboardItem(input: {
  row: SupabaseRoomRow;
  ownerPublicSlug: string | null;
  appUrl: string | undefined;
  photos: PropertyPhoto[];
  roomAmenityCount: number;
  newRequestsCount: number;
  activeCollaborationsCount: number;
}): OwnerInventoryDashboardItem {
  const status = getStandaloneStatus(input.row);
  const pricePerNight = Number(input.row.price_per_night);
  const minPrice = getMinimumActiveRoomPrice([{ isActive: input.row.is_active, pricePerNight }]);
  const hasDescription = Boolean(input.row.short_description?.trim() || input.row.full_description?.trim());
  const hasPhotos = input.photos.length > 0;
  const hasAmenitiesAndServices = input.roomAmenityCount > 0;
  const hasRooms = true;
  const hasPrices = Number.isFinite(pricePerNight) && pricePerNight > 0;
  const { completenessPercent, completionBreakdown } = buildInventoryCompletion({
    hasDescription,
    hasPhotos,
    hasAmenitiesAndServices,
    hasRooms,
    hasPrices,
  });

  return {
    id: input.row.id,
    kind: "standalone_room",
    ownerPublicSlug: input.ownerPublicSlug,
    title: input.row.title,
    shortTitle: input.row.title,
    propertyType: input.row.property_type ?? "Отдельный номер",
    city: input.row.city ?? "",
    address: input.row.address ?? "",
    coverImageUrl: input.photos[0]?.url ?? "",
    publicHref: getPublicHref(input.ownerPublicSlug),
    publicLabel: buildInventoryPublicLabel(input.ownerPublicSlug, input.appUrl),
    status: status.status,
    statusLabel: status.label,
    roomCount: 1,
    activeRoomCount: input.row.is_active ? 1 : 0,
    newRequestsCount: input.newRequestsCount,
    minPrice,
    activeCollaborationsCount: input.activeCollaborationsCount,
    allowAgentInquiries: input.row.allow_agent_inquiries,
    completenessPercent,
    completionBreakdown,
    createdAt: input.row.created_at,
    updatedAt: input.row.updated_at,
  };
}

export async function getOwnerInventoryDashboardData(): Promise<OwnerInventoryDashboardData> {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return {
      items: [],
      summary: {
        totalCount: 0,
        publishedCount: 0,
        draftCount: 0,
        archivedCount: 0,
        newRequestsCount: 0,
      },
      rightPanel: {
        averageCompletenessPercent: 0,
        completionBreakdown: {
          descriptionAndPhotos: { complete: 0, total: 0 },
          amenitiesAndServices: { complete: 0, total: 0 },
          pricesAndRooms: { complete: 0, total: 0 },
        },
      },
    };
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = getCanonicalAppUrl();
  const [propertyResult, standaloneRoomResult] = await Promise.all([
    supabase.from("properties").select("*").eq("owner_id", profile.id).order("created_at", { ascending: false }),
    supabase
      .from("rooms")
      .select("*")
      .eq("owner_id", profile.id)
      .eq("room_kind", "standalone_room")
      .order("created_at", { ascending: false }),
  ]);

  if (propertyResult.error) {
    failOwnerInventoryRead("owner_inventory_properties_lookup_failed", propertyResult.error);
  }

  if (standaloneRoomResult.error) {
    failOwnerInventoryRead("owner_inventory_standalone_rooms_lookup_failed", standaloneRoomResult.error);
  }

  const safePropertyRows = (propertyResult.data ?? []) as SupabasePropertyRow[];
  const safeStandaloneRows = (standaloneRoomResult.data ?? []) as SupabaseRoomRow[];
  const propertyIds = safePropertyRows.map((row) => row.id);
  const standaloneIds = safeStandaloneRows.map((row) => row.id);

  const [
    propertyRoomResult,
    propertyPhotoResult,
    standalonePhotoResult,
    requestResult,
    activePropertyLinkResult,
    activeRoomLinkResult,
    propertyFeatureResult,
    propertyRuleResult,
  ] = await Promise.all([
    propertyIds.length
      ? supabase
          .from("rooms")
          .select("id, property_id, title, price_per_night, is_active, short_description, full_description, allow_agent_inquiries")
          .in("property_id", propertyIds)
      : Promise.resolve({ data: [], error: null }),
    propertyIds.length
      ? supabase
          .from("property_photos")
          .select("*")
          .in("property_id", propertyIds)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    standaloneIds.length
      ? supabase
          .from("room_photos")
          .select("*")
          .in("room_id", standaloneIds)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("guest_requests")
      .select("property_id, room_id, status, source, agent_id, owner_id")
      .eq("owner_id", profile.id),
    supabase
      .from("agent_property_links")
      .select("id, property_id, owner_id, agent_id, status, proposal_message, collaboration_terms, owner_contact_visible, proposed_at, decided_at, created_at")
      .eq("owner_id", profile.id)
      .eq("status", "active"),
    supabase
      .from("agent_room_links")
      .select("id, room_id, owner_id, agent_id, status, proposal_message, collaboration_terms, owner_contact_visible, proposed_at, decided_at, created_at")
      .eq("owner_id", profile.id)
      .eq("status", "active"),
    propertyIds.length
      ? supabase.from("property_features").select("property_id").in("property_id", propertyIds)
      : Promise.resolve({ data: [], error: null }),
    propertyIds.length
      ? supabase.from("property_rules").select("property_id").in("property_id", propertyIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const readErrors: Array<[string, unknown]> = [
    ["owner_inventory_property_rooms_lookup_failed", propertyRoomResult.error],
    ["owner_inventory_property_photos_lookup_failed", propertyPhotoResult.error],
    ["owner_inventory_standalone_photos_lookup_failed", standalonePhotoResult.error],
    ["owner_inventory_requests_lookup_failed", requestResult.error],
    ["owner_inventory_property_links_lookup_failed", activePropertyLinkResult.error],
    ["owner_inventory_room_links_lookup_failed", activeRoomLinkResult.error],
    ["owner_inventory_property_features_lookup_failed", propertyFeatureResult.error],
    ["owner_inventory_property_rules_lookup_failed", propertyRuleResult.error],
  ];

  for (const [event, error] of readErrors) {
    if (error) {
      failOwnerInventoryRead(event, error);
    }
  }

  const safePropertyRoomRows = (propertyRoomResult.data ?? []) as PropertyRoomRow[];
  const safePropertyPhotoRows = (propertyPhotoResult.data ?? []) as SupabasePropertyPhotoRow[];
  const safeStandalonePhotoRows = (standalonePhotoResult.data ?? []) as SupabaseRoomPhotoRow[];
  const safeRequestRows = (requestResult.data ?? []) as SupabaseGuestRequestRow[];
  const safePropertyLinks = (activePropertyLinkResult.data ?? []) as SupabaseAgentPropertyLinkRow[];
  const safeRoomLinks = (activeRoomLinkResult.data ?? []) as SupabaseAgentRoomLinkRow[];
  const amenityRoomIds = [...safePropertyRoomRows.map((row) => row.id), ...standaloneIds];
  const roomAmenityResult = amenityRoomIds.length
    ? await supabase.from("room_amenities").select("room_id").in("room_id", amenityRoomIds)
    : { data: [], error: null };

  if (roomAmenityResult.error) {
    failOwnerInventoryRead("owner_inventory_room_amenities_lookup_failed", roomAmenityResult.error);
  }

  const roomAmenityRows = roomAmenityResult.data;

  const propertyPhotos = buildPropertyPhotoMap(safePropertyPhotoRows);
  const standalonePhotos = buildRoomPhotoMap(safeStandalonePhotoRows);
  const propertyFeatureCountByProperty = countById(
    ((propertyFeatureResult.data ?? []) as Array<{ property_id: string }>).map((row) => ({ id: row.property_id })),
  );
  const propertyRuleCountByProperty = countById(
    ((propertyRuleResult.data ?? []) as Array<{ property_id: string }>).map((row) => ({ id: row.property_id })),
  );
  const roomAmenityCountByRoom = countById(((roomAmenityRows ?? []) as Array<{ room_id: string }>).map((row) => ({ id: row.room_id })));
  const roomRowsByProperty = new Map<string, PropertyRoomRow[]>();

  for (const row of safePropertyRoomRows) {
    if (!row.property_id) {
      continue;
    }

    const existing = roomRowsByProperty.get(row.property_id) ?? [];
    existing.push(row);
    roomRowsByProperty.set(row.property_id, existing);
  }

  const propertyRequestCount = new Map<string, number>();
  const standaloneRequestCount = new Map<string, number>();

  for (const request of safeRequestRows) {
    if (!shouldCountRequestAsNew(request)) {
      continue;
    }

    if (request.property_id) {
      propertyRequestCount.set(request.property_id, (propertyRequestCount.get(request.property_id) ?? 0) + 1);
      continue;
    }

    standaloneRequestCount.set(request.room_id, (standaloneRequestCount.get(request.room_id) ?? 0) + 1);
  }

  const activePropertyCollaborationCount = countById(safePropertyLinks.map((row) => ({ id: row.property_id })));
  const activeRoomCollaborationCount = countById(safeRoomLinks.map((row) => ({ id: row.room_id })));

  const propertyItems = safePropertyRows.map((row) => {
    const photos = withLegacyPropertyCover(propertyPhotos.get(row.id) ?? [], row.cover_image_url);
    const roomRows = roomRowsByProperty.get(row.id) ?? [];
    const roomAmenityCount = roomRows.reduce((total, room) => total + (roomAmenityCountByRoom.get(room.id) ?? 0), 0);

    return mapPropertyDashboardItem({
      row,
      ownerPublicSlug: profile.slug || null,
      appUrl,
      photos,
      roomRows,
      propertyFeatureCount: propertyFeatureCountByProperty.get(row.id) ?? 0,
      propertyRuleCount: propertyRuleCountByProperty.get(row.id) ?? 0,
      roomAmenityCount,
      newRequestsCount: propertyRequestCount.get(row.id) ?? 0,
      activeCollaborationsCount: activePropertyCollaborationCount.get(row.id) ?? 0,
    });
  });

  const standaloneItems = safeStandaloneRows.map((row) =>
    mapStandaloneDashboardItem({
      row,
      ownerPublicSlug: profile.slug || null,
      appUrl,
      photos: standalonePhotos.get(row.id) ?? [],
      roomAmenityCount: roomAmenityCountByRoom.get(row.id) ?? 0,
      newRequestsCount: standaloneRequestCount.get(row.id) ?? 0,
      activeCollaborationsCount: activeRoomCollaborationCount.get(row.id) ?? 0,
    }),
  );

  const items = [...propertyItems, ...standaloneItems].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const totalCount = items.length;
  const publishedCount = items.filter((item) => item.status === "published").length;
  const draftCount = items.filter((item) => item.status === "draft").length;
  const archivedCount = items.filter((item) => item.status === "archived").length;
  const newRequestsCount = items.reduce((total, item) => total + item.newRequestsCount, 0);
  const averageCompletenessPercent = totalCount
    ? Math.round(items.reduce((total, item) => total + item.completenessPercent, 0) / totalCount)
    : 0;

  return {
    items,
    summary: {
      totalCount,
      publishedCount,
      draftCount,
      archivedCount,
      newRequestsCount,
    },
    rightPanel: {
      averageCompletenessPercent,
      completionBreakdown: {
        descriptionAndPhotos: {
          complete: items.filter((item) => item.completionBreakdown.hasDescriptionAndPhotos).length,
          total: totalCount,
        },
        amenitiesAndServices: {
          complete: items.filter((item) => item.completionBreakdown.hasAmenitiesAndServices).length,
          total: totalCount,
        },
        pricesAndRooms: {
          complete: items.filter((item) => item.completionBreakdown.hasPricesAndRooms).length,
          total: totalCount,
        },
      },
    },
  };
}
