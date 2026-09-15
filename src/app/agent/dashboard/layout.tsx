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
    <main className="dashboard-theme min-h-screen px-0 pb-[calc(40px+var(--safe-area-bottom))] pt-6 max-[1080px]:min-h-dvh max-[640px]:pt-4">
      <div className="mx-auto w-[calc(100%-48px)] max-w-[1400px] max-[1080px]:flex max-[1080px]:min-h-full max-[1080px]:w-[calc(100%-32px)] max-[640px]:w-[calc(100%-24px)]">
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
