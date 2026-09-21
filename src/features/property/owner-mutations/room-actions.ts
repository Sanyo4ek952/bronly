"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { markOwnerReferralMilestone } from "@/entities/referral";
import { isValidStayDateRange } from "@/entities/room";
import { createSupabaseServerClient } from "@/shared/api/supabase";
import { getCheckbox, getInteger, getNumber, getString } from "@/shared/lib/form-data";

import { mapActionError } from "./lib/errors";
import { replaceRoomAmenities } from "./lib/labels";
import {
  requireOwnedProperty,
  requireOwnedRoom,
  requireOwnerActiveRoomSlotAccess,
  requireOwnerMutationAccess,
} from "./lib/owner-access";
import {
  buildPropertyPath,
  buildPropertyPathWithState,
  buildPropertyRoomCreatePath,
  buildPropertyRoomPath,
  buildPropertyRoomSettingsPath,
  buildStandaloneRoomCreatePath,
  buildStandaloneRoomPath,
  buildStandaloneRoomSettingsPath,
} from "./lib/paths";
import { generateUniqueRoomSlug } from "./lib/slugs";
import { getUploadedRoomPhotoFiles, uploadRoomPhotoFiles, validateRoomPhotoFiles } from "./room-photo-upload";

const DEFAULT_TIMEZONE = "(UTC+03:00) Москва";
const DEFAULT_STANDALONE_ROOM_TYPE = "Отдельный номер";

function buildRoomRedirectTarget(formData: FormData, fallbackPath: string, state: Record<string, string>) {
  const redirectTo = getString(formData, "redirectTo");
  const basePath =
    redirectTo.startsWith("/dashboard/properties/") || redirectTo.startsWith("/dashboard/properties?")
      ? redirectTo
      : fallbackPath;
  const params = new URLSearchParams(state);
  const query = params.toString();

  if (!query) {
    return basePath;
  }

  return `${basePath}${basePath.includes("?") ? "&" : "?"}${query}`;
}

function getStandaloneRoomPayload(formData: FormData) {
  return {
    property_type: DEFAULT_STANDALONE_ROOM_TYPE,
    city: getString(formData, "city"),
    address: getString(formData, "address"),
    timezone: DEFAULT_TIMEZONE,
    short_description: null,
    full_description: getString(formData, "description") || null,
    phone: getString(formData, "phone") || null,
    telegram: getString(formData, "telegram") || null,
    check_in_time: null,
    check_out_time: null,
    allow_agent_inquiries: getCheckbox(formData, "allowAgentInquiries"),
    allow_owner_contact_sharing: false,
  };
}

function getStandaloneRoomUpdatePayload(formData: FormData) {
  return {
    property_type: DEFAULT_STANDALONE_ROOM_TYPE,
    city: getString(formData, "city"),
    address: getString(formData, "address"),
    timezone: DEFAULT_TIMEZONE,
    short_description: null,
    full_description: getString(formData, "description") || null,
    phone: getString(formData, "phone") || null,
    telegram: getString(formData, "telegram") || null,
    check_in_time: null,
    check_out_time: null,
  };
}

function getInitialBusyRange(formData: FormData) {
  const startsOn = getString(formData, "startsOn");
  const endsOn = getString(formData, "endsOn");

  if (!startsOn && !endsOn) {
    return { isValid: true, range: null };
  }

  if (!isValidStayDateRange(startsOn, endsOn)) {
    return { isValid: false, range: null };
  }

  return { isValid: true, range: { startsOn, endsOn } };
}

function validateStandaloneRoom(formData: FormData) {
  const payload = getStandaloneRoomPayload(formData);
  return Boolean(payload.city && payload.address);
}

export async function createOwnerRoom(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const isStandalone = !propertyId;
  const profile = await requireOwnerMutationAccess(propertyId ? buildPropertyRoomCreatePath(propertyId) : buildStandaloneRoomCreatePath());
  const title = getString(formData, "title");
  const roomPhotoFiles = getUploadedRoomPhotoFiles(formData);
  const roomPhotoError = validateRoomPhotoFiles(roomPhotoFiles);
  const initialBusyRange = getInitialBusyRange(formData);

  if (!title || !initialBusyRange.isValid || (!propertyId && !validateStandaloneRoom(formData))) {
    if (!propertyId) {
      redirect(`${buildStandaloneRoomCreatePath()}?error=validation`);
    }

    redirect(`${buildPropertyRoomCreatePath(propertyId)}?error=validation`);
  }

  if (roomPhotoError) {
    if (!propertyId) {
      redirect(`${buildStandaloneRoomCreatePath()}?error=${roomPhotoError}`);
    }

    redirect(`${buildPropertyRoomCreatePath(propertyId)}?error=${roomPhotoError}`);
  }

  if (propertyId) {
    await requireOwnedProperty(profile.id, propertyId, buildPropertyRoomCreatePath(propertyId));
  }

  await requireOwnerActiveRoomSlotAccess(propertyId ? buildPropertyRoomCreatePath(propertyId) : buildStandaloneRoomCreatePath());

  const supabase = await createSupabaseServerClient();
  const slug = await generateUniqueRoomSlug(title, { propertyId: propertyId || null, ownerId: profile.id });
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      owner_id: profile.id,
      property_id: propertyId || null,
      room_kind: isStandalone ? "standalone_room" : "property_room",
      slug,
      title,
      subtitle: null,
      capacity: getInteger(formData, "capacity", 1),
      bedrooms: getInteger(formData, "bedrooms", 1),
      area: getInteger(formData, "area", 0),
      price_per_night: getNumber(formData, "pricePerNight", 0),
      is_active: true,
      ...(isStandalone ? getStandaloneRoomPayload(formData) : {}),
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    if (!propertyId) {
      redirect(`${buildStandaloneRoomCreatePath()}?error=${mapActionError(error)}`);
    }

    redirect(`${buildPropertyRoomCreatePath(propertyId)}?error=${mapActionError(error)}`);
  }

  await replaceRoomAmenities(data.id, getString(formData, "amenities"));
  const photoUploadError = await uploadRoomPhotoFiles(supabase, profile.id, data.id, roomPhotoFiles);

  if (initialBusyRange.range) {
    await supabase.from("room_busy_ranges").insert({
      room_id: data.id,
      starts_on: initialBusyRange.range.startsOn,
      ends_on: initialBusyRange.range.endsOn,
      source: "manual",
      label: null,
      note: null,
    });
  }

  await markOwnerReferralMilestone(profile.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/rooms");

  if (!propertyId) {
    redirect(`${buildStandaloneRoomPath(data.id)}&success=${photoUploadError ? "room-created-photo-upload" : "room-created"}`);
  }

  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "rooms", { success: photoUploadError ? "room-created-photo-upload" : "room-created" }));
}

export async function updateOwnerRoom(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const roomId = getString(formData, "roomId");
  const isStandalone = !propertyId;
  const profile = await requireOwnerMutationAccess(
    propertyId ? buildPropertyPath(propertyId, "rooms") : buildStandaloneRoomSettingsPath(roomId),
  );
  const title = getString(formData, "title");
  const fallbackPath = propertyId ? buildPropertyRoomSettingsPath(propertyId, roomId) : buildStandaloneRoomSettingsPath(roomId);

  if (!roomId || !title || (!propertyId && !validateStandaloneRoom(formData))) {
    redirect(buildRoomRedirectTarget(formData, fallbackPath, { error: "validation" }));
  }

  await requireOwnedRoom(profile.id, roomId, propertyId || null, fallbackPath);
  if (propertyId) {
    await requireOwnedProperty(profile.id, propertyId, fallbackPath);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("rooms")
    .update({
      property_id: propertyId || null,
      room_kind: isStandalone ? "standalone_room" : "property_room",
      title,
      subtitle: null,
      capacity: getInteger(formData, "capacity", 1),
      bedrooms: getInteger(formData, "bedrooms", 1),
      area: getInteger(formData, "area", 0),
      price_per_night: getNumber(formData, "pricePerNight", 0),
      ...(isStandalone
        ? getStandaloneRoomUpdatePayload(formData)
        : {
            property_type: null,
            city: null,
            address: null,
            timezone: null,
            short_description: null,
            full_description: null,
            phone: null,
            telegram: null,
            check_in_time: null,
            check_out_time: null,
            allow_agent_inquiries: false,
            allow_owner_contact_sharing: false,
          }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("owner_id", profile.id);

  if (error) {
    redirect(buildRoomRedirectTarget(formData, fallbackPath, { error: mapActionError(error) }));
  }

  await replaceRoomAmenities(roomId, getString(formData, "amenities"));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");

  if (!propertyId) {
    revalidatePath(buildStandaloneRoomPath(roomId));
    revalidatePath(buildStandaloneRoomSettingsPath(roomId));
    redirect(buildRoomRedirectTarget(formData, fallbackPath, { success: "room-saved" }));
  }

  revalidatePath(buildPropertyPath(propertyId));
  revalidatePath(buildPropertyRoomPath(propertyId, roomId));
  revalidatePath(buildPropertyRoomSettingsPath(propertyId, roomId));
  redirect(buildRoomRedirectTarget(formData, fallbackPath, { success: "room-saved" }));
}

export async function setOwnerRoomArchived(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const roomId = getString(formData, "roomId");
  const shouldArchive = getString(formData, "archived") === "true";
  const fallbackPath = propertyId ? buildPropertyRoomSettingsPath(propertyId, roomId) : buildStandaloneRoomSettingsPath(roomId);
  const profile = await requireOwnerMutationAccess(fallbackPath);

  await requireOwnedRoom(profile.id, roomId, propertyId || null, fallbackPath);
  if (propertyId) {
    await requireOwnedProperty(profile.id, propertyId, fallbackPath);
  }

  if (!shouldArchive) {
    await requireOwnerActiveRoomSlotAccess(fallbackPath);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("rooms")
    .update({
      is_active: !shouldArchive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("owner_id", profile.id);

  if (error) {
    redirect(buildRoomRedirectTarget(formData, fallbackPath, { error: mapActionError(error) }));
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");

  if (!propertyId) {
    revalidatePath(buildStandaloneRoomPath(roomId));
    revalidatePath(buildStandaloneRoomSettingsPath(roomId));
  } else {
    revalidatePath(buildPropertyPath(propertyId));
    revalidatePath(buildPropertyRoomPath(propertyId, roomId));
    revalidatePath(buildPropertyRoomSettingsPath(propertyId, roomId));
  }

  redirect(buildRoomRedirectTarget(formData, fallbackPath, { success: shouldArchive ? "room-archived" : "room-restored" }));
}

export async function deleteOwnerRoom(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  const roomId = getString(formData, "roomId");
  const profile = await requireOwnerMutationAccess(
    propertyId ? buildPropertyPath(propertyId, "rooms") : buildStandaloneRoomSettingsPath(roomId),
  );
  const confirmation = getString(formData, "confirmation");

  if (!roomId || confirmation !== "DELETE") {
    if (!propertyId) {
      redirect(`${buildStandaloneRoomSettingsPath(roomId)}?error=delete-confirmation`);
    }

    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "delete-confirmation" }));
  }

  const redirectPath = propertyId ? buildPropertyPath(propertyId, "rooms") : buildStandaloneRoomSettingsPath(roomId);
  await requireOwnedRoom(profile.id, roomId, propertyId || null, redirectPath);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("rooms").delete().eq("id", roomId).eq("owner_id", profile.id);

  if (error) {
    if (!propertyId) {
      redirect(`${buildStandaloneRoomSettingsPath(roomId)}?error=delete`);
    }

    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "delete" }));
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");

  if (!propertyId) {
    redirect("/dashboard/properties?success=room-deleted");
  }

  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "rooms", { success: "room-deleted" }));
}
