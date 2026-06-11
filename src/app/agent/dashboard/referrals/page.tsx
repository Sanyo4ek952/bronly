import { redirect } from "next/navigation";

import { getOrCreateReferralInvite } from "@/entities/referral";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { ReferralShareCard } from "@/widgets/referral-share/referral-share-card";

export default async function AgentReferralPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const invite = await getOrCreateReferralInvite({
    profile,
    inviterRole: "agent",
  });

  if (!invite) {
    redirect("/agent/dashboard");
  }

  return (
    <section className="br-owner-stack">
      <ReferralShareCard
        invite={invite}
        title="Пригласить владельца"
        description="Отправьте персональную ссылку владельцу. Если он зарегистрируется по ней и создаст первый объект или отдельный номер, в админке появится ручное продление вашей подписки."
      />
    </section>
  );
}
