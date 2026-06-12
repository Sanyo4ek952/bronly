import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { SubscriptionStatusCard } from "@/widgets/subscription-status-card";

export default async function OwnerSubscriptionPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return null;
  }

  const subscription = await getSubscriptionRuntimeState(profile.id, "owner");

  return <SubscriptionStatusCard subscription={subscription} backHref="/dashboard" backLabel="Вернуться на главную" />;
}
