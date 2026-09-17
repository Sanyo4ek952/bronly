import { redirect } from "next/navigation";

import { getCurrentAuthProfile } from "@/shared/api/supabase";

export async function requireAgentProfile() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.roles.includes("agent")) {
    redirect("/dashboard");
  }

  return profile;
}
