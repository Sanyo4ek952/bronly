import { createSupabaseAdminClient, createSupabaseServerClient } from "@/shared/api/supabase";

const PHOTO_BUCKET = "property-media";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PROPERTY_PHOTOS_PER_UPLOAD = 10;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function sanitizeFileName(name: string) {
  const trimmed = name.trim().toLowerCase();
  const safe = trimmed.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
  return safe || "photo";
}

function buildStoragePath(profileId: string, propertyId: string, fileName: string) {
  return `${profileId}/properties/${propertyId}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

function getUploadedFiles(formData: FormData, key: string) {
  return formData.getAll(key).filter((file): file is File => file instanceof File && file.size > 0);
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

export function getUploadedPropertyPhotoFiles(formData: FormData) {
  return getUploadedFiles(formData, "photos");
}

export function validatePropertyPhotoFiles(files: File[]) {
  if (files.length > MAX_PROPERTY_PHOTOS_PER_UPLOAD) {
    return "photo-count";
  }

  for (const file of files) {
    const fileError = validateImageFile(file);

    if (fileError) {
      return fileError;
    }
  }

  return "";
}

export async function uploadPropertyPhotoFiles(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string,
  propertyId: string,
  files: File[],
) {
  if (!files.length) {
    return null;
  }

  const fileError = validatePropertyPhotoFiles(files);

  if (fileError) {
    return fileError;
  }

  const { data: photoRows } = await supabase
    .from("property_photos")
    .select("sort_order")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: false })
    .limit(1);
  let nextSortOrder = Number(photoRows?.[0]?.sort_order ?? -1) + 1;

  const admin = createSupabaseAdminClient();
  const uploadedStoragePaths: string[] = [];

  for (const file of files) {
    const storagePath = buildStoragePath(profileId, propertyId, file.name);
    const uploadResult = await admin.storage.from(PHOTO_BUCKET).upload(storagePath, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

    if (uploadResult.error) {
      if (uploadedStoragePaths.length) {
        await admin.storage.from(PHOTO_BUCKET).remove(uploadedStoragePaths);
      }

      return "photo-upload";
    }

    uploadedStoragePaths.push(storagePath);

    const { data: publicUrlData } = admin.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);
    const { error } = await supabase.from("property_photos").insert({
      property_id: propertyId,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
      sort_order: nextSortOrder,
    });

    if (error) {
      await admin.storage.from(PHOTO_BUCKET).remove(uploadedStoragePaths);
      return "photo-upload";
    }

    nextSortOrder += 1;
  }

  return null;
}
