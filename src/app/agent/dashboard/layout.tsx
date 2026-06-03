import { redirect } from "next/navigation";

import { getCurrentAuthProfile, getPrimaryRole } from "@/shared/api/supabase";
import { OwnerShell } from "@/widgets/owner-shell";

export default async function AgentDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (getPrimaryRole(profile.roles) !== "agent") {
    redirect("/dashboard");
  }

  return (
    <main className="br-page br-page--dashboard">
      <div className="br-container br-dashboard-layout">
        <OwnerShell userName={profile.displayName} roleLabel="Агент" roleKind="agent">
          {children}
        </OwnerShell>
      </div>
    </main>
  );
}
