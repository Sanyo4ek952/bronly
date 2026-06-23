import type { SupabaseCollectionRow, SupabasePropertyRow, SupabaseRoomRow } from "@/shared/api/supabase";

export type ResultReason =
  | "archived"
  | "duplicate"
  | "not_allowed"
  | "not_found"
  | "save_failed"
  | "unauthorized"
  | "validation";

export type MutationResult = {
  ok: boolean;
  collectionId?: string;
  collectionSlug?: string;
  reason?: ResultReason;
};

export type PropertyCandidateRow = Pick<SupabasePropertyRow, "id" | "owner_id" | "title" | "city" | "address">;

export type RoomPropertyJoinRow = {
  id: string;
  title: string;
  city: string;
  address: string;
  owner_id: string;
};

export type RoomCandidateRow = Pick<
  SupabaseRoomRow,
  "id" | "owner_id" | "room_kind" | "property_id" | "title" | "subtitle" | "property_type" | "city" | "address"
> & {
  properties: RoomPropertyJoinRow | RoomPropertyJoinRow[] | null;
};

export type CollectionItemQueryRow = {
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
    | {
        id: string;
        title: string;
        subtitle: string | null;
        property_id: string | null;
        property_type?: string | null;
        city?: string | null;
        address?: string | null;
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
      }
    | Array<{
        id: string;
        title: string;
        subtitle: string | null;
        property_id: string | null;
        property_type?: string | null;
        city?: string | null;
        address?: string | null;
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

export type OwnedCollection = {
  profileId: string;
  role: "owner" | "agent";
  row: SupabaseCollectionRow;
};
