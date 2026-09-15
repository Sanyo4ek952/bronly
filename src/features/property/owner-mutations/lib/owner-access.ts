import { redirect } from "next/navigation";

import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { createSupabaseServerClient, getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { canAccessOwnerMutations } from "@/shared/api/supabase/access-rules";

function appendAccessError(redirectPath: string) {
  return redirectPath + (redirectPath.includes("?") ? "&" : "?") + "error=access";
}

export async function requireOwnerProfile() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!canAccessOwnerMutations(profile)) {
    redirect(getPostLoginRedirect(profile.roles));
  }

  return profile;
}

export async function requireOwnedProperty(profileId: string, propertyId: string, redirectPath: string) {
  if (!propertyId) {
    redirect(appendAccessError(redirectPath));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, owner_id")
    .eq("id", propertyId)
    .eq("owner_id", profileId)
    .maybeSingle();

  if (error || !data) {
    redirect(appendAccessError(redirectPath));
  }

  return data;
}

export async function requireOwnedRoom(profileId: string, roomId: string, propertyId: string | null, redirectPath: string) {
  if (!roomId) {
    redirect(appendAccessError(redirectPath));
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("rooms").select("id, owner_id, property_id, room_kind").eq("id", roomId).eq("owner_id", profileId);

  query = propertyId
    ? query.eq("property_id", propertyId).eq("room_kind", "property_room")
    : query.is("property_id", null).eq("room_kind", "standalone_room");

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    redirect(appendAccessError(redirectPath));
  }

  return data;
}

export async function requireOwnerMutationAccess(redirectPath: string) {
  const profile = await requireOwnerProfile();
  const subscription = await getSubscriptionRuntimeState(profile.id, "owner");

  if (!subscription.isMutationAllowed) {
    redirect(`${redirectPath}${redirectPath.includes("?") ? "&" : "?"}error=subscription`);
  }

  return profile;
}

export async function requireOwnerActiveRoomSlotAccess(redirectPath: string) {
  const profile = await requireOwnerProfile();
  const subscription = await getSubscriptionRuntimeState(profile.id, "owner");

  if (!subscription.isMutationAllowed) {
    redirect(`${redirectPath}${redirectPath.includes("?") ? "&" : "?"}error=subscription`);
  }

  if (!subscription.canAddActiveRoom) {
    redirect(`${redirectPath}${redirectPath.includes("?") ? "&" : "?"}error=room-limit`);
  }

  return profile;
}
