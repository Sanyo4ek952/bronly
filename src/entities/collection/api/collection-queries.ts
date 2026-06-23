import { createSupabaseServerClient } from "@/shared/api/supabase";
import type { AuthProfile, SupabaseCollectionRow } from "@/shared/api/supabase";
import { withFallbackSlug } from "@/shared/lib/slug";

import type {
  CollectionAccessCandidate,
  CollectionDetailData,
  CollectionItem,
  CollectionListData,
  CollectionRole,
  CollectionSummary,
} from "../model/types";
import { requireProfileWithRole } from "./collection-access";
import { getSingleRow, mapCollectionChoice, mapCollectionItem, mapCollectionSummary, mapPropertyCandidate, mapRoomCandidate } from "./collection-mappers";
import type { CollectionItemQueryRow, OwnedCollection, PropertyCandidateRow, RoomCandidateRow } from "./collection-types";

export async function generateUniqueCollectionSlug(title: string) {
  const supabase = await createSupabaseServerClient();
  const baseSlug = withFallbackSlug(title, "collection");

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const { data } = await supabase.from("collections").select("id").eq("slug", candidate).maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function getOwnedCollectionForMutation(
  profile: AuthProfile,
  role: CollectionRole,
  collectionId: string,
): Promise<OwnedCollection | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("collections").select("*").eq("id", collectionId).maybeSingle();
  const row = (data ?? null) as SupabaseCollectionRow | null;

  if (!row || row.creator_id !== profile.id || row.creator_role !== role) {
    return null;
  }

  return { profileId: profile.id, role, row };
}

export async function getNextSortOrder(collectionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("collection_items")
    .select("sort_order")
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const lastRow = (data ?? [])[0] as { sort_order?: number } | undefined;

  return (lastRow?.sort_order ?? -1) + 1;
}

export async function getCollectionsForRole(role: CollectionRole): Promise<CollectionSummary[]> {
  const profile = await requireProfileWithRole(role);

  if (!profile) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("collections")
    .select("*")
    .eq("creator_id", profile.id)
    .eq("creator_role", role)
    .order("is_archived", { ascending: true })
    .order("updated_at", { ascending: false });

  const safeRows = (rows ?? []) as SupabaseCollectionRow[];

  if (!safeRows.length) {
    return [];
  }

  const { data: itemRows } = await supabase.from("collection_items").select("collection_id").in(
    "collection_id",
    safeRows.map((row) => row.id),
  );

  const itemCountMap = new Map<string, number>();

  for (const row of (itemRows ?? []) as Array<{ collection_id: string }>) {
    itemCountMap.set(row.collection_id, (itemCountMap.get(row.collection_id) ?? 0) + 1);
  }

  return safeRows.map((row) => mapCollectionSummary(row, itemCountMap.get(row.id) ?? 0));
}

export async function getAvailableProperties(profile: AuthProfile, role: CollectionRole): Promise<CollectionAccessCandidate[]> {
  const supabase = await createSupabaseServerClient();
  const ownResult = await supabase
    .from("properties")
    .select("id, owner_id, title, city, address")
    .eq("owner_id", profile.id)
    .order("title", { ascending: true });
  const ownRows = (ownResult.data ?? []) as PropertyCandidateRow[];

  if (role === "owner") {
    return ownRows.map((row) => mapPropertyCandidate(row, profile.id));
  }

  const { data: linkedRows } = await supabase
    .from("agent_property_links")
    .select("property_id")
    .eq("agent_id", profile.id)
    .eq("status", "active");
  const linkedPropertyIds = (linkedRows ?? []).map((row) => row.property_id as string);

  if (!linkedPropertyIds.length) {
    return ownRows.map((row) => mapPropertyCandidate(row, profile.id));
  }

  const linkedResult = await supabase
    .from("properties")
    .select("id, owner_id, title, city, address")
    .in("id", linkedPropertyIds)
    .order("title", { ascending: true });
  const linkedProperties = (linkedResult.data ?? []) as PropertyCandidateRow[];

  const propertyMap = new Map<string, PropertyCandidateRow>();
  for (const row of [...ownRows, ...linkedProperties]) {
    propertyMap.set(row.id, row);
  }

  return Array.from(propertyMap.values()).map((row) => mapPropertyCandidate(row, profile.id));
}

export async function getAvailableRooms(profile: AuthProfile, role: CollectionRole): Promise<CollectionAccessCandidate[]> {
  const supabase = await createSupabaseServerClient();
  const propertyCandidates = await getAvailableProperties(profile, role);
  const propertyRoomsQuery = propertyCandidates.length
    ? supabase
        .from("rooms")
        .select("id, owner_id, room_kind, property_id, property_type, city, address, title, subtitle, properties(id, title, city, address, owner_id)")
        .in(
          "property_id",
          propertyCandidates.map((item) => item.id),
        )
        .eq("is_active", true)
        .order("title", { ascending: true })
    : Promise.resolve({ data: [] });
  const ownStandaloneRoomsQuery = supabase
    .from("rooms")
    .select("id, owner_id, room_kind, property_id, property_type, city, address, title, subtitle, properties(id, title, city, address, owner_id)")
    .eq("owner_id", profile.id)
    .eq("room_kind", "standalone_room")
    .eq("is_active", true)
    .order("title", { ascending: true });
  const standaloneLinkedRoomIds =
    role === "agent"
      ? (
          (
            await supabase
              .from("agent_room_links")
              .select("room_id")
              .eq("agent_id", profile.id)
              .eq("status", "active")
          ).data ?? []
        ).map((row) => row.room_id as string)
      : [];
  const linkedStandaloneRoomsQuery =
    role === "agent" && standaloneLinkedRoomIds.length
      ? supabase
          .from("rooms")
          .select("id, owner_id, room_kind, property_id, property_type, city, address, title, subtitle, properties(id, title, city, address, owner_id)")
          .in("id", standaloneLinkedRoomIds)
          .eq("room_kind", "standalone_room")
          .eq("is_active", true)
          .order("title", { ascending: true })
      : Promise.resolve({ data: [] });
  const [propertyRoomsResult, ownStandaloneRoomsResult, linkedStandaloneRoomsResult] = await Promise.all([
    propertyRoomsQuery,
    ownStandaloneRoomsQuery,
    linkedStandaloneRoomsQuery,
  ]);

  const roomMap = new Map<string, CollectionAccessCandidate>();
  for (const row of [
    ...((propertyRoomsResult.data ?? []) as RoomCandidateRow[]),
    ...((ownStandaloneRoomsResult.data ?? []) as RoomCandidateRow[]),
    ...((linkedStandaloneRoomsResult.data ?? []) as RoomCandidateRow[]),
  ]) {
    const mapped = mapRoomCandidate(row, profile.id);

    if (mapped) {
      roomMap.set(mapped.id, mapped);
    }
  }

  return Array.from(roomMap.values());
}

export async function getCollectionItems(collectionId: string): Promise<CollectionItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("collection_items")
    .select(
      "id, property_id, room_id, sort_order, created_at, properties(id, title, city, address), rooms(id, title, subtitle, property_id, property_type, city, address, properties(id, title, city, address))",
    )
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return ((data ?? []) as CollectionItemQueryRow[])
    .map((row) => mapCollectionItem(row))
    .filter((item): item is CollectionItem => Boolean(item));
}

export async function getCollectionListData(role: CollectionRole): Promise<CollectionListData> {
  const profile = await requireProfileWithRole(role);

  if (!profile) {
    return {
      role,
      collections: [],
    };
  }

  return {
    role,
    collections: await getCollectionsForRole(role),
  };
}

export async function getCollectionDetailData(
  role: CollectionRole,
  collectionId: string,
): Promise<CollectionDetailData> {
  const profile = await requireProfileWithRole(role);

  if (!profile || !collectionId) {
    return {
      role,
      collection: null,
      items: [],
      availableProperties: [],
      availableRooms: [],
      propertyChoices: [],
      roomChoices: [],
    };
  }

  const collections = await getCollectionsForRole(role);
  const collection = collections.find((item) => item.id === collectionId) ?? null;

  if (!collection) {
    return {
      role,
      collection: null,
      items: [],
      availableProperties: [],
      availableRooms: [],
      propertyChoices: [],
      roomChoices: [],
    };
  }

  const [allProperties, allRooms, items] = await Promise.all([
    getAvailableProperties(profile, role),
    getAvailableRooms(profile, role),
    getCollectionItems(collection.id),
  ]);

  const selectedPropertyIds = new Set(items.filter((item) => item.kind === "property").map((item) => item.propertyId));
  const selectedRoomIds = new Set(items.filter((item) => item.kind === "room").map((item) => item.roomId));

  return {
    role,
    collection,
    items,
    availableProperties: allProperties.filter((item) => !selectedPropertyIds.has(item.id)),
    availableRooms: allRooms.filter((item) => !selectedRoomIds.has(item.id)),
    propertyChoices: allProperties.map((item) => mapCollectionChoice(item, selectedPropertyIds)),
    roomChoices: allRooms.map((item) => mapCollectionChoice(item, selectedRoomIds)),
  };
}
