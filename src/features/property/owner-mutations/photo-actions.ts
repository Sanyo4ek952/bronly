"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/shared/api/supabase";
import { getString } from "@/shared/lib/form-data";

import { requireOwnerMutationAccess } from "./lib/owner-access";
import { buildPropertyPath, buildPropertyPathWithState } from "./lib/paths";

const PHOTO_BUCKET = "property-media";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type PropertyPhotoRecord = {
  id: string;
  property_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

type RoomPhotoRecord = {
  id: string;
  room_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

function sanitizeFileName(name: string) {
  const trimmed = name.trim().toLowerCase();
  const safe = trimmed.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
  return safe || "photo";
}

function buildStoragePath(profileId: string, scope: "properties" | "rooms", entityId: string, fileName: string) {
  return `${profileId}/${scope}/${entityId}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

function getUploadedFile(formData: FormData, key: string) {
  const file = formData.get(key);

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  return file;
}

function validateImageFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "photo-type";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "photo-size";
  }

  return "";
}

async function loadOwnedProperty(propertyId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("properties").select("id, slug").eq("id", propertyId).maybeSingle();

  return {
    supabase,
    property: (data ?? null) as { id: string; slug: string } | null,
  };
}

async function loadOwnedRoom(roomId: string, propertyId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("rooms")
    .select("id, property_id")
    .eq("id", roomId)
    .eq("property_id", propertyId)
    .maybeSingle();

  return {
    supabase,
    room: (data ?? null) as { id: string; property_id: string } | null,
  };
}

async function setPropertyPhotoOrder(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, propertyId: string, orderedIds: string[]) {
  for (const [index, photoId] of orderedIds.entries()) {
    const { error } = await supabase
      .from("property_photos")
      .update({ sort_order: index })
      .eq("id", photoId)
      .eq("property_id", propertyId);

    if (error) {
      return error;
    }
  }

  return null;
}

async function setRoomPhotoOrder(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, roomId: string, orderedIds: string[]) {
  for (const [index, photoId] of orderedIds.entries()) {
    const { error } = await supabase.from("room_photos").update({ sort_order: index }).eq("id", photoId).eq("room_id", roomId);

    if (error) {
      return error;
    }
  }

  return null;
}

function revalidatePropertyMedia(propertyId: string, propertySlug?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath(buildPropertyPath(propertyId));
  revalidatePath(buildPropertyPath(propertyId, "rooms"));

  if (propertySlug) {
    revalidatePath(`/p/${propertySlug}`);
  }
}

export async function uploadPropertyPhoto(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const profile = await requireOwnerMutationAccess(buildPropertyPath(propertyId));
  const file = getUploadedFile(formData, "photo");

  if (!propertyId || !file) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-validation" }));
  }

  const fileError = validateImageFile(file);

  if (fileError) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: fileError }));
  }

  const { supabase, property } = await loadOwnedProperty(propertyId);

  if (!property) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-upload" }));
  }

  const { data: photoRows } = await supabase
    .from("property_photos")
    .select("sort_order")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = Number(photoRows?.[0]?.sort_order ?? -1) + 1;

  const admin = createSupabaseAdminClient();
  const storagePath = buildStoragePath(profile.id, "properties", propertyId, file.name);
  const uploadResult = await admin.storage.from(PHOTO_BUCKET).upload(storagePath, await file.arrayBuffer(), {
    contentType: file.type,
    upsert: false,
  });

  if (uploadResult.error) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-upload" }));
  }

  const { data: publicUrlData } = admin.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);
  const { error } = await supabase.from("property_photos").insert({
    property_id: propertyId,
    storage_path: storagePath,
    public_url: publicUrlData.publicUrl,
    sort_order: nextSortOrder,
  });

  if (error) {
    await admin.storage.from(PHOTO_BUCKET).remove([storagePath]);
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-upload" }));
  }

  revalidatePropertyMedia(propertyId, property.slug);
  redirect(buildPropertyPathWithState(propertyId, "property", { success: "photo-uploaded" }));
}

export async function deletePropertyPhoto(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId));
  const photoId = getString(formData, "photoId");

  if (!propertyId || !photoId) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-delete" }));
  }

  const { supabase, property } = await loadOwnedProperty(propertyId);

  if (!property) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-delete" }));
  }

  const { data: photoRowData } = await supabase
    .from("property_photos")
    .select("id, property_id, storage_path")
    .eq("id", photoId)
    .eq("property_id", propertyId)
    .maybeSingle();
  const photoRow = (photoRowData ?? null) as Pick<PropertyPhotoRecord, "id" | "property_id" | "storage_path"> | null;

  if (!photoRow) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-delete" }));
  }

  const admin = createSupabaseAdminClient();

  if (!photoRow.storage_path.startsWith("legacy/")) {
    const removeResult = await admin.storage.from(PHOTO_BUCKET).remove([photoRow.storage_path]);

    if (removeResult.error) {
      redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-delete" }));
    }
  }

  const { error } = await supabase.from("property_photos").delete().eq("id", photoId).eq("property_id", propertyId);

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-delete" }));
  }

  revalidatePropertyMedia(propertyId, property.slug);
  redirect(buildPropertyPathWithState(propertyId, "property", { success: "photo-deleted" }));
}

export async function setPropertyPhotoPrimary(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId));
  const photoId = getString(formData, "photoId");

  if (!propertyId || !photoId) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-order" }));
  }

  const { supabase, property } = await loadOwnedProperty(propertyId);

  if (!property) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-order" }));
  }

  const { data: photoRowsData } = await supabase
    .from("property_photos")
    .select("id, property_id, storage_path, sort_order, created_at")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const photoRows = (photoRowsData ?? []) as PropertyPhotoRecord[];

  if (!photoRows.some((photo) => photo.id === photoId)) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-order" }));
  }

  const orderedIds = [photoId, ...photoRows.filter((photo) => photo.id !== photoId).map((photo) => photo.id)];
  const error = await setPropertyPhotoOrder(supabase, propertyId, orderedIds);

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "property", { error: "photo-order" }));
  }

  revalidatePropertyMedia(propertyId, property.slug);
  redirect(buildPropertyPathWithState(propertyId, "property", { success: "photo-primary" }));
}

export async function uploadRoomPhoto(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const profile = await requireOwnerMutationAccess(buildPropertyPath(propertyId, "rooms"));
  const roomId = getString(formData, "roomId");
  const file = getUploadedFile(formData, "photo");

  if (!propertyId || !roomId || !file) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-validation" }));
  }

  const fileError = validateImageFile(file);

  if (fileError) {
    redirect(
      buildPropertyPathWithState(propertyId, "rooms", {
        error: fileError === "photo-type" ? "room-photo-type" : "room-photo-size",
      }),
    );
  }

  const { supabase, room } = await loadOwnedRoom(roomId, propertyId);

  if (!room) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-upload" }));
  }

  const { data: propertyData } = await supabase.from("properties").select("slug").eq("id", propertyId).maybeSingle();
  const propertySlug = (propertyData?.slug as string | undefined) ?? "";
  const { data: photoRows } = await supabase
    .from("room_photos")
    .select("sort_order")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = Number(photoRows?.[0]?.sort_order ?? -1) + 1;

  const admin = createSupabaseAdminClient();
  const storagePath = buildStoragePath(profile.id, "rooms", roomId, file.name);
  const uploadResult = await admin.storage.from(PHOTO_BUCKET).upload(storagePath, await file.arrayBuffer(), {
    contentType: file.type,
    upsert: false,
  });

  if (uploadResult.error) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-upload" }));
  }

  const { data: publicUrlData } = admin.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);
  const { error } = await supabase.from("room_photos").insert({
    room_id: roomId,
    storage_path: storagePath,
    public_url: publicUrlData.publicUrl,
    sort_order: nextSortOrder,
  });

  if (error) {
    await admin.storage.from(PHOTO_BUCKET).remove([storagePath]);
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-upload" }));
  }

  revalidatePropertyMedia(propertyId, propertySlug);
  redirect(buildPropertyPathWithState(propertyId, "rooms", { success: "room-photo-uploaded" }));
}

export async function deleteRoomPhoto(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "rooms"));
  const roomId = getString(formData, "roomId");
  const photoId = getString(formData, "photoId");

  if (!propertyId || !roomId || !photoId) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-delete" }));
  }

  const { supabase, room } = await loadOwnedRoom(roomId, propertyId);

  if (!room) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-delete" }));
  }

  const { data: propertyData } = await supabase.from("properties").select("slug").eq("id", propertyId).maybeSingle();
  const propertySlug = (propertyData?.slug as string | undefined) ?? "";
  const { data: photoRowData } = await supabase
    .from("room_photos")
    .select("id, room_id, storage_path")
    .eq("id", photoId)
    .eq("room_id", roomId)
    .maybeSingle();
  const photoRow = (photoRowData ?? null) as Pick<RoomPhotoRecord, "id" | "room_id" | "storage_path"> | null;

  if (!photoRow) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-delete" }));
  }

  const admin = createSupabaseAdminClient();
  const removeResult = await admin.storage.from(PHOTO_BUCKET).remove([photoRow.storage_path]);

  if (removeResult.error) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-delete" }));
  }

  const { error } = await supabase.from("room_photos").delete().eq("id", photoId).eq("room_id", roomId);

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-delete" }));
  }

  revalidatePropertyMedia(propertyId, propertySlug);
  redirect(buildPropertyPathWithState(propertyId, "rooms", { success: "room-photo-deleted" }));
}

export async function setRoomPhotoPrimary(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "rooms"));
  const roomId = getString(formData, "roomId");
  const photoId = getString(formData, "photoId");

  if (!propertyId || !roomId || !photoId) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-order" }));
  }

  const { supabase, room } = await loadOwnedRoom(roomId, propertyId);

  if (!room) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-order" }));
  }

  const { data: propertyData } = await supabase.from("properties").select("slug").eq("id", propertyId).maybeSingle();
  const propertySlug = (propertyData?.slug as string | undefined) ?? "";
  const { data: photoRowsData } = await supabase
    .from("room_photos")
    .select("id, room_id, storage_path, sort_order, created_at")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const photoRows = (photoRowsData ?? []) as RoomPhotoRecord[];

  if (!photoRows.some((photo) => photo.id === photoId)) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-order" }));
  }

  const orderedIds = [photoId, ...photoRows.filter((photo) => photo.id !== photoId).map((photo) => photo.id)];
  const error = await setRoomPhotoOrder(supabase, roomId, orderedIds);

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "room-photo-order" }));
  }

  revalidatePropertyMedia(propertyId, propertySlug);
  redirect(buildPropertyPathWithState(propertyId, "rooms", { success: "room-photo-primary" }));
}
