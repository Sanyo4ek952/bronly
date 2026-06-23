import type {
  AgentCollaborationTargetType,
  AgentLinkStatus,
} from "@/entities/collaboration/model/types";

export type PropertyLookupRow = {
  id: string;
  owner_id: string;
  title: string;
  short_title: string;
  city: string;
  address: string;
  short_description: string | null;
  allow_agent_inquiries: boolean;
};

export type RoomLookupRow = {
  id: string;
  owner_id: string;
  property_id: string | null;
  room_kind: "property_room" | "standalone_room";
  title: string;
  subtitle: string | null;
  property_type: string | null;
  city: string | null;
  address: string | null;
  short_description: string | null;
  allow_agent_inquiries: boolean;
  price_per_night: number;
  properties:
    | {
        id: string;
        owner_id: string;
        title: string;
        city: string;
        address: string;
      }
    | Array<{
        id: string;
        owner_id: string;
        title: string;
        city: string;
        address: string;
      }>
    | null;
};

export type CollaborationRoomRow = {
  id: string;
  property_id: string | null;
  title: string;
  subtitle: string | null;
  price_per_night: number;
};

export type UnifiedProposalTarget = {
  linkId: string;
  targetType: AgentCollaborationTargetType;
  targetId: string;
  ownerId: string;
  title: string;
  subtitle: string;
  description: string;
};

export type ProfileContactRow = {
  display_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
};

export type AgentPropertyLinkListRow = {
  id: string;
  property_id: string;
  status: AgentLinkStatus | null;
  proposal_message: string | null;
  collaboration_terms: string | null;
  owner_contact_visible: boolean | null;
  properties: { title?: string } | null;
  profiles: ProfileContactRow | null;
};

export type AgentRoomLinkListRow = {
  id: string;
  room_id: string;
  status: AgentLinkStatus | null;
  proposal_message: string | null;
  collaboration_terms: string | null;
  owner_contact_visible: boolean | null;
  rooms: { title?: string; subtitle?: string | null; price_per_night?: number } | null;
  profiles: ProfileContactRow | null;
};
