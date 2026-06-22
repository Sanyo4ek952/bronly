import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUnreadNotificationCount } from "@/entities/notification";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile, getPrimaryRole } from "@/shared/api/supabase";
import { createRobots } from "@/shared/lib/seo";
import { buildDashboardShellData, DashboardShell } from "@/widgets/dashboard-shell";

export const metadata: Metadata = {
  robots: createRobots(false),
};

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

  const [subscription, unreadNotificationsCount] = await Promise.all([
    getSubscriptionRuntimeState(profile.id, "agent"),
    getUnreadNotificationCount(),
  ]);

  const shellData = buildDashboardShellData({
    role: "agent",
    displayName: profile.displayName,
    unreadNotificationsCount,
    subscription,
  });

  return (
    <main className="br-page br-page--dashboard">
      <div className="br-container br-dashboard-layout">
        <DashboardShell
          userName={profile.displayName}
          roleLabel={shellData.roleLabel}
          roleKind={shellData.roleKind}
          topbar={shellData.topbar}
          notice={shellData.notice}
        >
          {children}
        </DashboardShell>
      </div>
    </main>
  );
}
