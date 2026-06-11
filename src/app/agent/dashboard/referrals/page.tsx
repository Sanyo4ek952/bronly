import { redirect } from "next/navigation";

import { getOrCreateReferralInvite } from "@/entities/referral";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { ReferralSharePanel } from "@/widgets/referral-share/referral-share-panel";

export default async function AgentReferralPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const [ownerInvite, agentInvite] = await Promise.all([
    getOrCreateReferralInvite({
      profile,
      inviterRole: "agent",
      inviteeRole: "owner",
    }),
    getOrCreateReferralInvite({
      profile,
      inviterRole: "agent",
      inviteeRole: "agent",
    }),
  ]);

  if (!ownerInvite || !agentInvite) {
    redirect("/agent/dashboard");
  }

  return <ReferralSharePanel initialRole="owner" invites={{ owner: ownerInvite, agent: agentInvite }} />;
}
