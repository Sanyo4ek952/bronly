import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase";
import type { AuthProfile, SupabaseCollectionRow, SupabasePropertyRow, SupabaseRoomRow } from "@/shared/api/supabase";
import { withFallbackSlug } from "@/shared/lib/slug";

import type {
  CollectionAccessCandidate,
  CollectionItem,
  CollectionManagementData,
  CollectionRole,
  CollectionSummary,
} from "../model/types";

type ResultReason =
  | "archived"
  | "duplicate"
  | "not_allowed"
  | "not_found"
  | "save_failed"
  | "unauthorized"
  | "validation";

type MutationResult = {
  ok: boolean;
  collectionId?: string;
  reason?: ResultReason;
};

type PropertyCandidateRow = Pick<SupabasePropertyRow, "id" | "owner_id" | "title" | "city" | "address">;
type RoomPropertyJoinRow = {
  id: string;
  title: string;
  city: string;
  address: string;
  owner_id: string;
};
type RoomCandidateRow = Pick<SupabaseRoomRow, "id" | "property_id" | "title" | "subtitle"> & {
  properties: RoomPropertyJoinRow | RoomPropertyJoinRow[] | null;
};
type CollectionItemQueryRow = {
  id: string;
  property_id: string | null;
  room_id: string | null;
  sort_order: number;
  created_at: string;
  properties:
    | {
        id: string;
        title: string;
        city: string;
        address: string;
      }
    | Array<{
        id: string;
        title: string;
        city: string;
        address: string;
      }>
    | null;
  rooms:
    | ({
        id: string;
        title: string;
        subtitle: string | null;
        property_id: string;
        properties:
          | {
              id: string;
              title: string;
              city: string;
              address: string;
            }
          | Array<{
              id: string;
              title: string;
              city: string;
              address: string;
            }>
          | null;
      })
    | Array<{
        id: string;
        title: string;
        subtitle: string | null;
        property_id: string;
        properties:
          | {
              id: string;
              title: string;
              city: string;
              address: string;
            }
          | Array<{
              id: string;
              title: string;
              city: string;
              address: string;
            }>
          | null;
      }>
    | null;
};

function getSingleRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function buildCollectionSubtitle(itemCount: number, isArchived: boolean) {
  const itemLabel =
    itemCount % 10 === 1 && itemCount % 100 !== 11
      ? "элемент"
      : itemCount % 10 >= 2 && itemCount % 10 <= 4 && (itemCount % 100 < 12 || itemCount % 100 > 14)
        ? "элемента"
        : "элементов";

  return `${itemCount} ${itemLabel}${isArchived ? " · архив" : ""}`;
}

function mapCollectionSummary(row: SupabaseCollectionRow, itemCount: number): CollectionSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    isArchived: row.is_archived,
    itemCount,
    viewsCount: row.views_count,
    lastOpenedAt: row.last_opened_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPropertyCandidate(row: PropertyCandidateRow, currentProfileId: string): CollectionAccessCandidate {
  return {
    id: row.id,
    title: row.title,
    subtitle: `${row.city}, ${row.address}`,
    scope: row.owner_id === currentProfileId ? "own" : "collaboration",
  };
}

function mapRoomCandidate(row: RoomCandidateRow, currentProfileId: string): CollectionAccessCandidate | null {
  const property = getSingleRow(row.properties);

  if (!property) {
    return null;
  }

  const subtitleParts = [property.title];
  if (row.subtitle) {
    subtitleParts.push(row.subtitle);
  }
  subtitleParts.push(property.city);

  return {
    id: row.id,
    title: row.title,
    subtitle: subtitleParts.join(" · "),
    scope: property.owner_id === currentProfileId ? "own" : "collaboration",
  };
}

function mapCollectionItem(row: CollectionItemQueryRow): CollectionItem | null {
  if (row.property_id) {
    const property = getSingleRow(row.properties);

    if (!property) {
      return null;
    }

    return {
      id: row.id,
      kind: "property",
      propertyId: row.property_id,
      roomId: null,
      sortOrder: row.sort_order,
      title: property.title,
      subtitle: `${property.city}, ${property.address}`,
      createdAt: row.created_at,
    };
  }

  if (!row.room_id) {
    return null;
  }

  const room = getSingleRow(row.rooms);
  const property = room ? getSingleRow(room.properties) : null;

  if (!room || !property) {
    return null;
  }

  const subtitleParts = [property.title];
  if (room.subtitle) {
    subtitleParts.push(room.subtitle);
  }
  subtitleParts.push(property.city);

  return {
    id: row.id,
    kind: "room",
    propertyId: room.property_id,
    roomId: row.room_id,
    sortOrder: row.sort_order,
    title: room.title,
    subtitle: subtitleParts.join(" · "),
    createdAt: row.created_at,
  };
}

async function requireProfileWithRole(role: CollectionRole): Promise<AuthProfile | null> {
  const profile = await getCurrentAuthProfile();

  if (!profile || !profile.roles.includes(role)) {
    return null;
  }

  return profile;
}

async function generateUniqueCollectionSlug(title: string) {
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

async function getCollectionRowForMutation(
  profile: AuthProfile,
  role: CollectionRole,
  collectionId: string,
): Promise<SupabaseCollectionRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("collections").select("*").eq("id", collectionId).maybeSingle();
  const row = (data ?? null) as SupabaseCollectionRow | null;

  if (!row || row.creator_id !== profile.id || row.creator_role !== role) {
    return null;
  }

  return row;
}

async function hasActiveCollaboration(profileId: string, propertyId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("agent_property_links")
    .select("id")
    .eq("agent_id", profileId)
    .eq("property_id", propertyId)
    .eq("status", "active")
    .maybeSingle();

  return Boolean(data);
}

async function getAccessibleProperty(profile: AuthProfile, role: CollectionRole, propertyId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("properties").select("id, owner_id, title, city, address").eq("id", propertyId).maybeSingle();
  const property = (data ?? null) as PropertyCandidateRow | null;

  if (!property) {
    return null;
  }

  if (property.owner_id === profile.id) {
    return property;
  }

  if (role !== "agent") {
    return null;
  }

  return (await hasActiveCollaboration(profile.id, property.id)) ? property : null;
}

async function getAccessibleRoom(profile: AuthProfile, role: CollectionRole, roomId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("rooms")
    .select("id, property_id, title, subtitle, properties!inner(id, title, city, address, owner_id)")
    .eq("id", roomId)
    .maybeSingle();
  const room = (data ?? null) as RoomCandidateRow | null;

  if (!room) {
    return null;
  }

  const property = getSingleRow(room.properties);

  if (!property) {
    return null;
  }

  if (property.owner_id === profile.id) {
    return room;
  }

  if (role !== "agent") {
    return null;
  }

  return (await hasActiveCollaboration(profile.id, room.property_id)) ? room : null;
}

async function getNextSortOrder(collectionId: string) {
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

async function getCollectionsForRole(role: CollectionRole): Promise<CollectionSummary[]> {
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

async function getAvailableProperties(profile: AuthProfile, role: CollectionRole) {
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

async function getAvailableRooms(profile: AuthProfile, role: CollectionRole) {
  const supabase = await createSupabaseServerClient();
  const propertyCandidates = await getAvailableProperties(profile, role);

  if (!propertyCandidates.length) {
    return [];
  }

  const { data } = await supabase
    .from("rooms")
    .select("id, property_id, title, subtitle, properties!inner(id, title, city, address, owner_id)")
    .in(
      "property_id",
      propertyCandidates.map((item) => item.id),
    )
    .order("title", { ascending: true });

  const roomMap = new Map<string, CollectionAccessCandidate>();
  for (const row of (data ?? []) as RoomCandidateRow[]) {
    const mapped = mapRoomCandidate(row, profile.id);

    if (mapped) {
      roomMap.set(mapped.id, mapped);
    }
  }

  return Array.from(roomMap.values());
}

async function getCollectionItems(collectionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("collection_items")
    .select(
      "id, property_id, room_id, sort_order, created_at, properties(id, title, city, address), rooms(id, title, subtitle, property_id, properties(id, title, city, address))",
    )
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return ((data ?? []) as CollectionItemQueryRow[])
    .map((row) => mapCollectionItem(row))
    .filter((item): item is CollectionItem => Boolean(item));
}

export async function getOwnerCollections() {
  return getCollectionsForRole("owner");
}

export async function getAgentCollections() {
  return getCollectionsForRole("agent");
}

export async function getCollectionManagementData(
  role: CollectionRole,
  collectionId?: string,
): Promise<CollectionManagementData> {
  const profile = await requireProfileWithRole(role);

  if (!profile) {
    return {
      role,
      collections: [],
      selectedCollection: null,
      items: [],
      availableProperties: [],
      availableRooms: [],
    };
  }

  const collections = await getCollectionsForRole(role);
  const selectedCollection =
    (collectionId ? collections.find((item) => item.id === collectionId) : null) ?? collections[0] ?? null;

  const [allProperties, allRooms, items] = await Promise.all([
    getAvailableProperties(profile, role),
    getAvailableRooms(profile, role),
    selectedCollection ? getCollectionItems(selectedCollection.id) : Promise.resolve([]),
  ]);

  const selectedPropertyIds = new Set(items.filter((item) => item.kind === "property").map((item) => item.propertyId));
  const selectedRoomIds = new Set(items.filter((item) => item.kind === "room").map((item) => item.roomId));

  return {
    role,
    collections,
    selectedCollection,
    items,
    availableProperties: allProperties.filter((item) => !selectedPropertyIds.has(item.id)),
    availableRooms: allRooms.filter((item) => !selectedRoomIds.has(item.id)),
  };
}

export async function createCollection(input: { role: CollectionRole; title: string }): Promise<MutationResult> {
  const profile = await requireProfileWithRole(input.role);
  const title = input.title.trim();

  if (!profile) {
    return { ok: false, reason: "unauthorized" };
  }

  if (!title) {
    return { ok: false, reason: "validation" };
  }

  const supabase = await createSupabaseServerClient();
  const slug = await generateUniqueCollectionSlug(title);
  const { data, error } = await supabase
    .from("collections")
    .insert({
      creator_id: profile.id,
      creator_role: input.role,
      slug,
      title,
      guest_label: null,
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    return { ok: false, reason: "save_failed" };
  }

  return { ok: true, collectionId: data.id as string };
}

export async function renameCollection(input: {
  role: CollectionRole;
  collectionId: string;
  title: string;
}): Promise<MutationResult> {
  const profile = await requireProfileWithRole(input.role);
  const title = input.title.trim();

  if (!profile) {
    return { ok: false, reason: "unauthorized" };
  }

  if (!input.collectionId || !title) {
    return { ok: false, reason: "validation" };
  }

  const collection = await getCollectionRowForMutation(profile, input.role, input.collectionId);

  if (!collection) {
    return { ok: false, reason: "not_found" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("collections")
    .update({
      title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.collectionId);

  if (error) {
    return { ok: false, reason: "save_failed", collectionId: input.collectionId };
  }

  return { ok: true, collectionId: input.collectionId };
}

export async function archiveCollection(input: {
  role: CollectionRole;
  collectionId: string;
}): Promise<MutationResult> {
  const profile = await requireProfileWithRole(input.role);

  if (!profile) {
    return { ok: false, reason: "unauthorized" };
  }

  if (!input.collectionId) {
    return { ok: false, reason: "validation" };
  }

  const collection = await getCollectionRowForMutation(profile, input.role, input.collectionId);

  if (!collection) {
    return { ok: false, reason: "not_found" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("collections")
    .update({
      is_archived: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.collectionId);

  if (error) {
    return { ok: false, reason: "save_failed", collectionId: input.collectionId };
  }

  return { ok: true, collectionId: input.collectionId };
}

export async function addPropertyToCollection(input: {
  role: CollectionRole;
  collectionId: string;
  propertyId: string;
}): Promise<MutationResult> {
  const profile = await requireProfileWithRole(input.role);

  if (!profile) {
    return { ok: false, reason: "unauthorized" };
  }

  if (!input.collectionId || !input.propertyId) {
    return { ok: false, reason: "validation" };
  }

  const collection = await getCollectionRowForMutation(profile, input.role, input.collectionId);

  if (!collection) {
    return { ok: false, reason: "not_found" };
  }

  if (collection.is_archived) {
    return { ok: false, reason: "archived", collectionId: input.collectionId };
  }

  const property = await getAccessibleProperty(profile, input.role, input.propertyId);

  if (!property) {
    return { ok: false, reason: "not_allowed", collectionId: input.collectionId };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("collection_items")
    .select("id")
    .eq("collection_id", input.collectionId)
    .eq("property_id", property.id)
    .is("room_id", null)
    .maybeSingle();

  if (existing?.id) {
    return { ok: false, reason: "duplicate", collectionId: input.collectionId };
  }

  const { error } = await supabase.from("collection_items").insert({
    collection_id: input.collectionId,
    property_id: property.id,
    room_id: null,
    sort_order: await getNextSortOrder(input.collectionId),
  });

  if (error) {
    return { ok: false, reason: "save_failed", collectionId: input.collectionId };
  }

  return { ok: true, collectionId: input.collectionId };
}

export async function addRoomToCollection(input: {
  role: CollectionRole;
  collectionId: string;
  roomId: string;
}): Promise<MutationResult> {
  const profile = await requireProfileWithRole(input.role);

  if (!profile) {
    return { ok: false, reason: "unauthorized" };
  }

  if (!input.collectionId || !input.roomId) {
    return { ok: false, reason: "validation" };
  }

  const collection = await getCollectionRowForMutation(profile, input.role, input.collectionId);

  if (!collection) {
    return { ok: false, reason: "not_found" };
  }

  if (collection.is_archived) {
    return { ok: false, reason: "archived", collectionId: input.collectionId };
  }

  const room = await getAccessibleRoom(profile, input.role, input.roomId);

  if (!room) {
    return { ok: false, reason: "not_allowed", collectionId: input.collectionId };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("collection_items")
    .select("id")
    .eq("collection_id", input.collectionId)
    .eq("room_id", room.id)
    .is("property_id", null)
    .maybeSingle();

  if (existing?.id) {
    return { ok: false, reason: "duplicate", collectionId: input.collectionId };
  }

  const { error } = await supabase.from("collection_items").insert({
    collection_id: input.collectionId,
    property_id: null,
    room_id: room.id,
    sort_order: await getNextSortOrder(input.collectionId),
  });

  if (error) {
    return { ok: false, reason: "save_failed", collectionId: input.collectionId };
  }

  return { ok: true, collectionId: input.collectionId };
}

export async function removeCollectionItem(input: {
  role: CollectionRole;
  collectionId: string;
  itemId: string;
}): Promise<MutationResult> {
  const profile = await requireProfileWithRole(input.role);

  if (!profile) {
    return { ok: false, reason: "unauthorized" };
  }

  if (!input.collectionId || !input.itemId) {
    return { ok: false, reason: "validation" };
  }

  const collection = await getCollectionRowForMutation(profile, input.role, input.collectionId);

  if (!collection) {
    return { ok: false, reason: "not_found" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("id", input.itemId)
    .eq("collection_id", input.collectionId);

  if (error) {
    return { ok: false, reason: "save_failed", collectionId: input.collectionId };
  }

  return { ok: true, collectionId: input.collectionId };
}

export { buildCollectionSubtitle };
