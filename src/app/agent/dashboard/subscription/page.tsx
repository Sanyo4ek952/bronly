import { redirect } from "next/navigation";

import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { SubscriptionStatusCard } from "@/widgets/subscription-status-card";

export default async function AgentSubscriptionPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const subscription = await getSubscriptionRuntimeState(profile.id, "agent");

  return (
    <SubscriptionStatusCard
      subscription={subscription}
      backHref="/agent/dashboard"
      backLabel="Вернуться на главную"
    />
  );
}
