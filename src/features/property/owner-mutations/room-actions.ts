"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase";
import { getCheckbox, getInteger, getNumber, getString } from "@/shared/lib/form-data";

import { mapActionError } from "./lib/errors";
import { replaceRoomAmenities } from "./lib/labels";
import { requireOwnerMutationAccess } from "./lib/owner-access";
import { buildPropertyPath, buildPropertyPathWithState, buildPropertyRoomCreatePath } from "./lib/paths";
import { generateUniqueRoomSlug } from "./lib/slugs";

export async function createOwnerRoom(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(propertyId ? buildPropertyRoomCreatePath(propertyId) : "/dashboard/properties");
  const title = getString(formData, "title");

  if (!propertyId || !title) {
    if (!propertyId) {
      redirect("/dashboard/properties?error=validation");
    }

    redirect(`${buildPropertyRoomCreatePath(propertyId)}?error=validation`);
  }

  const supabase = await createSupabaseServerClient();
  const slug = await generateUniqueRoomSlug(propertyId, title);
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      property_id: propertyId,
      slug,
      title,
      subtitle: getString(formData, "subtitle") || null,
      capacity: getInteger(formData, "capacity", 1),
      bedrooms: getInteger(formData, "bedrooms", 1),
      area: getInteger(formData, "area", 0),
      price_per_night: getNumber(formData, "pricePerNight", 0),
      is_active: getCheckbox(formData, "isActive"),
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    redirect(`${buildPropertyRoomCreatePath(propertyId)}?error=${mapActionError(error)}`);
  }

  await replaceRoomAmenities(data.id as string, getString(formData, "amenities"));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "rooms", { success: "room-created" }));
}

export async function updateOwnerRoom(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "rooms"));
  const roomId = getString(formData, "roomId");
  const title = getString(formData, "title");

  if (!propertyId || !roomId || !title) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "validation" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("rooms")
    .update({
      title,
      subtitle: getString(formData, "subtitle") || null,
      capacity: getInteger(formData, "capacity", 1),
      bedrooms: getInteger(formData, "bedrooms", 1),
      area: getInteger(formData, "area", 0),
      price_per_night: getNumber(formData, "pricePerNight", 0),
      is_active: getCheckbox(formData, "isActive"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("property_id", propertyId);

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: mapActionError(error) }));
  }

  await replaceRoomAmenities(roomId, getString(formData, "amenities"));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "rooms", { success: "room-saved" }));
}

export async function deleteOwnerRoom(formData: FormData) {
  const propertyId = getString(formData, "propertyId");
  await requireOwnerMutationAccess(buildPropertyPath(propertyId, "rooms"));
  const roomId = getString(formData, "roomId");
  const confirmation = getString(formData, "confirmation");

  if (!propertyId || !roomId || confirmation !== "DELETE") {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "delete-confirmation" }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("rooms").delete().eq("id", roomId).eq("property_id", propertyId);

  if (error) {
    redirect(buildPropertyPathWithState(propertyId, "rooms", { error: "delete" }));
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath(buildPropertyPath(propertyId));
  redirect(buildPropertyPathWithState(propertyId, "rooms", { success: "room-deleted" }));
}
