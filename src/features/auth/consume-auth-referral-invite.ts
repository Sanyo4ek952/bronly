import type { User } from "@supabase/supabase-js";

import { consumeReferralInviteForProfile } from "@/entities/referral";

export async function consumeAuthReferralInvite(user: User, profileId: string) {
  const metadata = user.user_metadata ?? {};
  const inviteToken =
    typeof metadata.referral_invite_token === "string" ? metadata.referral_invite_token : "";

  if (!inviteToken) {
    return true;
  }

  const inviteeRole = metadata.role === "agent" ? "agent" : "owner";

  return consumeReferralInviteForProfile({
    inviteToken,
    invitedProfileId: profileId,
    inviteeRole,
  });
}
