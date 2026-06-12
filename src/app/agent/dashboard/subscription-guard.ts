import { redirect } from "next/navigation";

import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";

export async function ensureAgentSubscriptionMutationAllowed(redirectPath: string) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const subscription = await getSubscriptionRuntimeState(profile.id, "agent");

  if (!subscription.isMutationAllowed) {
    redirect(`${redirectPath}${redirectPath.includes("?") ? "&" : "?"}error=subscription`);
  }

  return profile;
}
