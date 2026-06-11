import { redirect } from "next/navigation";

import { getOrCreateReferralInvite } from "@/entities/referral";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { ReferralShareCard } from "@/widgets/referral-share/referral-share-card";

export default async function OwnerReferralPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const invite = await getOrCreateReferralInvite({
    profile,
    inviterRole: "owner",
  });

  if (!invite) {
    redirect("/dashboard");
  }

  return (
    <section className="br-owner-stack">
      <ReferralShareCard
        invite={invite}
        title="Пригласить агента"
        description="Отправьте персональную ссылку. Если агент зарегистрируется по ней и дойдет до первого активного сотрудничества, в админке появится ручное продление вашей подписки."
      />
    </section>
  );
}
