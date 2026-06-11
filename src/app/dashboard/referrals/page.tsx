import { redirect } from "next/navigation";

import { getOrCreateReferralInvite } from "@/entities/referral";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { ReferralSharePanel } from "@/widgets/referral-share/referral-share-panel";

export default async function OwnerReferralPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const [ownerInvite, agentInvite] = await Promise.all([
    getOrCreateReferralInvite({
      profile,
      inviterRole: "owner",
      inviteeRole: "owner",
    }),
    getOrCreateReferralInvite({
      profile,
      inviterRole: "owner",
      inviteeRole: "agent",
    }),
  ]);

  if (!ownerInvite || !agentInvite) {
    redirect("/dashboard");
  }

  return <ReferralSharePanel initialRole="agent" invites={{ owner: ownerInvite, agent: agentInvite }} />;
}
