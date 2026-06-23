import { createSupabaseServerClient } from "@/shared/api/supabase";

import type { CollectionRole } from "../model/types";
import { getAccessibleProperty, getAccessibleRoom, requireProfileWithRole } from "./collection-access";
import { generateUniqueCollectionSlug, getNextSortOrder, getOwnedCollectionForMutation } from "./collection-queries";
import type { MutationResult } from "./collection-types";

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
    .select("id, slug")
    .maybeSingle();

  if (error || !data?.id) {
    return { ok: false, reason: "save_failed" };
  }

  return {
    ok: true,
    collectionId: data.id as string,
    collectionSlug: data.slug as string,
  };
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

  const ownedCollection = await getOwnedCollectionForMutation(profile, input.role, input.collectionId);

  if (!ownedCollection) {
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
    return {
      ok: false,
      reason: "save_failed",
      collectionId: input.collectionId,
      collectionSlug: ownedCollection.row.slug,
    };
  }

  return { ok: true, collectionId: input.collectionId, collectionSlug: ownedCollection.row.slug };
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

  const ownedCollection = await getOwnedCollectionForMutation(profile, input.role, input.collectionId);

  if (!ownedCollection) {
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
    return {
      ok: false,
      reason: "save_failed",
      collectionId: input.collectionId,
      collectionSlug: ownedCollection.row.slug,
    };
  }

  return { ok: true, collectionId: input.collectionId, collectionSlug: ownedCollection.row.slug };
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

  const ownedCollection = await getOwnedCollectionForMutation(profile, input.role, input.collectionId);

  if (!ownedCollection) {
    return { ok: false, reason: "not_found" };
  }

  if (ownedCollection.row.is_archived) {
    return {
      ok: false,
      reason: "archived",
      collectionId: input.collectionId,
      collectionSlug: ownedCollection.row.slug,
    };
  }

  const property = await getAccessibleProperty(profile, input.role, input.propertyId);

  if (!property) {
    return {
      ok: false,
      reason: "not_allowed",
      collectionId: input.collectionId,
      collectionSlug: ownedCollection.row.slug,
    };
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
    return {
      ok: false,
      reason: "duplicate",
      collectionId: input.collectionId,
      collectionSlug: ownedCollection.row.slug,
    };
  }

  const { error } = await supabase.from("collection_items").insert({
    collection_id: input.collectionId,
    property_id: property.id,
    room_id: null,
    sort_order: await getNextSortOrder(input.collectionId),
  });

  if (error) {
    return {
      ok: false,
      reason: "save_failed",
      collectionId: input.collectionId,
      collectionSlug: ownedCollection.row.slug,
    };
  }

  return { ok: true, collectionId: input.collectionId, collectionSlug: ownedCollection.row.slug };
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

  const ownedCollection = await getOwnedCollectionForMutation(profile, input.role, input.collectionId);

  if (!ownedCollection) {
    return { ok: false, reason: "not_found" };
  }

  if (ownedCollection.row.is_archived) {
    return {
      ok: false,
      reason: "archived",
      collectionId: input.collectionId,
      collectionSlug: ownedCollection.row.slug,
    };
  }

  const room = await getAccessibleRoom(profile, input.role, input.roomId);

  if (!room) {
    return {
      ok: false,
      reason: "not_allowed",
      collectionId: input.collectionId,
      collectionSlug: ownedCollection.row.slug,
    };
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
    return {
      ok: false,
      reason: "duplicate",
      collectionId: input.collectionId,
      collectionSlug: ownedCollection.row.slug,
    };
  }

  const { error } = await supabase.from("collection_items").insert({
    collection_id: input.collectionId,
    property_id: null,
    room_id: room.id,
    sort_order: await getNextSortOrder(input.collectionId),
  });

  if (error) {
    return {
      ok: false,
      reason: "save_failed",
      collectionId: input.collectionId,
      collectionSlug: ownedCollection.row.slug,
    };
  }

  return { ok: true, collectionId: input.collectionId, collectionSlug: ownedCollection.row.slug };
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

  const ownedCollection = await getOwnedCollectionForMutation(profile, input.role, input.collectionId);

  if (!ownedCollection) {
    return { ok: false, reason: "not_found" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("id", input.itemId)
    .eq("collection_id", input.collectionId);

  if (error) {
    return {
      ok: false,
      reason: "save_failed",
      collectionId: input.collectionId,
      collectionSlug: ownedCollection.row.slug,
    };
  }

  return { ok: true, collectionId: input.collectionId, collectionSlug: ownedCollection.row.slug };
}
