import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { createSupabaseServerClient } from "@/shared/api/supabase/server-auth";
import type { AgentCollaborationTargetType } from "@/entities/collaboration/model/types";

import { getSingleRow, mapStandaloneRoomLocation } from "./collaboration-formatters";
import type { RoomLookupRow, UnifiedProposalTarget } from "./collaboration-types";

export async function getActiveAgentPropertyIds(profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("agent_property_links")
    .select("property_id")
    .eq("agent_id", profileId)
    .eq("status", "active");

  return Array.from(new Set((data ?? []).map((row) => row.property_id as string)));
}

export async function getActiveAgentRoomIds(profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("agent_room_links")
    .select("room_id")
    .eq("agent_id", profileId)
    .eq("status", "active");

  return Array.from(new Set((data ?? []).map((row) => row.room_id as string)));
}

export async function hasActivePropertyCollaboration(profileId: string, propertyId: string) {
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

export async function hasActiveRoomCollaboration(profileId: string, roomId: string) {
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

export async function getAccessibleRoomForAgent(profileId: string, roomId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("rooms")
    .select("id, owner_id, property_id, room_kind, properties(id, owner_id)")
    .eq("id", roomId)
    .maybeSingle();
  const room = (data ?? null) as
    | {
        id: string;
        owner_id: string;
        property_id: string | null;
        room_kind: "property_room" | "standalone_room";
        properties:
          | {
              id: string;
              owner_id: string;
            }
          | Array<{
              id: string;
              owner_id: string;
            }>
          | null;
      }
    | null;

  if (!room) {
    return null;
  }

  if (room.owner_id === profileId) {
    return room;
  }

  const property = getSingleRow(room.properties);

  if (room.property_id && property) {
    return (await hasActivePropertyCollaboration(profileId, room.property_id)) ? room : null;
  }

  return (await hasActiveRoomCollaboration(profileId, room.id)) ? room : null;
}

export async function resolveProposalTarget(input: {
  profileId: string;
  targetType: AgentCollaborationTargetType;
  propertyId?: string;
  roomId?: string;
}): Promise<UnifiedProposalTarget | null> {
  if (!canUseSupabase()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();

  if (input.targetType === "property") {
    if (!input.propertyId) {
      return null;
    }

    const { data: propertyData } = await supabase
      .from("properties")
      .select("id, owner_id, title, city, address, short_description, allow_agent_inquiries")
      .eq("id", input.propertyId)
      .maybeSingle();
    const property = propertyData as {
      id: string;
      owner_id: string;
      title: string;
      city: string;
      address: string;
      short_description: string | null;
      allow_agent_inquiries: boolean;
    } | null;

    if (!property || !property.allow_agent_inquiries || property.owner_id === input.profileId) {
      return null;
    }

    return {
      linkId: property.id,
      targetType: "property",
      targetId: property.id,
      ownerId: property.owner_id,
      title: property.title,
      subtitle: [property.city, property.address].filter(Boolean).join(", "),
      description: property.short_description ?? "",
    };
  }

  if (!input.roomId) {
    return null;
  }

  const { data: roomData } = await supabase
    .from("rooms")
    .select(
      "id, owner_id, property_id, room_kind, title, subtitle, property_type, city, address, short_description, allow_agent_inquiries, properties(id, owner_id, title, city, address)",
    )
    .eq("id", input.roomId)
    .eq("room_kind", "standalone_room")
    .maybeSingle();
  const room = (roomData ?? null) as RoomLookupRow | null;

  if (!room || !room.allow_agent_inquiries || room.owner_id === input.profileId) {
    return null;
  }

  return {
    linkId: room.id,
    targetType: "standalone_room",
    targetId: room.id,
    ownerId: room.owner_id,
    title: room.title,
    subtitle: mapStandaloneRoomLocation(room),
    description: room.short_description ?? room.subtitle ?? "",
  };
}
