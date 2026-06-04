import { redirect } from "next/navigation";

import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";

export async function requireOwnerProfile() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
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
