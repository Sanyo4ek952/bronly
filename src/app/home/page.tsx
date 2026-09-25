import { redirect } from "next/navigation";

import { getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";

export default async function HomeRedirectPage() {
  const profile = await getCurrentAuthProfile();

  redirect(profile ? getPostLoginRedirect(profile.roles) : "/");
}
