import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase";
import type { AuthProfile } from "@/shared/api/supabase";

import type { CollectionRole } from "../model/types";
import type { PropertyCandidateRow, RoomCandidateRow } from "./collection-types";
import { getSingleRow } from "./collection-mappers";

export async function requireProfileWithRole(role: CollectionRole): Promise<AuthProfile | null> {
  const profile = await getCurrentAuthProfile();

  if (!profile || !profile.roles.includes(role)) {
    return null;
  }

  return profile;
}

export async function hasActiveCollaboration(profileId: string, propertyId: string) {
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

export async function hasActiveStandaloneRoomCollaboration(profileId: string, roomId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("agent_room_links")
    .select("id")
    .eq("agent_id", profileId)
    .eq("room_id", roomId)
    .eq("status", "active")
    .maybeSingle();

  return Boolean(data);
}

export async function getAccessibleProperty(profile: AuthProfile, role: CollectionRole, propertyId: string) {
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

export async function getAccessibleRoom(profile: AuthProfile, role: CollectionRole, roomId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("rooms")
    .select("id, owner_id, room_kind, property_id, property_type, city, address, title, subtitle, properties(id, title, city, address, owner_id)")
    .eq("id", roomId)
    .maybeSingle();
  const room = (data ?? null) as RoomCandidateRow | null;

  if (!room) {
    return null;
  }

  const property = getSingleRow(room.properties);

  if (!property && room.room_kind !== "standalone_room") {
    return null;
  }

  if ((property?.owner_id ?? room.owner_id) === profile.id) {
    return room;
  }

  if (role !== "agent") {
    return null;
  }

  if (room.property_id) {
    return (await hasActiveCollaboration(profile.id, room.property_id)) ? room : null;
  }

  return (await hasActiveStandaloneRoomCollaboration(profile.id, room.id)) ? room : null;
}
