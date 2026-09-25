import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { redirect } from "next/navigation";

import { getUnreadNotificationCount } from "@/entities/notification";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile, getPrimaryRole } from "@/shared/api/supabase";
import { createRobots } from "@/shared/lib/seo";
import { buildDashboardShellData, DashboardShell } from "@/widgets/dashboard-shell";

const inter = Inter({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--font-dashboard" });

export const metadata: Metadata = {
  robots: createRobots(false),
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (getPrimaryRole(profile.roles) === "agent" && !profile.roles.includes("owner")) {
    redirect("/agent/dashboard");
  }

  const [subscription, unreadNotificationsCount] = await Promise.all([
    getSubscriptionRuntimeState(profile.id, "owner"),
    getUnreadNotificationCount(),
  ]);

  const shellData = buildDashboardShellData({
    role: "owner",
    displayName: profile.displayName,
    unreadNotificationsCount,
    subscription,
    hasAdminRole: profile.roles.includes("admin"),
    hasOwnerRole: profile.roles.includes("owner"),
  });

  return (
    <main className={`${inter.variable} dashboard-theme dashboard-refresh min-h-dvh`}>
      <DashboardShell
        userName={profile.displayName}
        roleLabel={shellData.roleLabel}
        roleKind={shellData.roleKind}
        unreadNotificationsCount={unreadNotificationsCount}
        topbar={shellData.topbar}
        notice={shellData.notice}
      >
        {children}
      </DashboardShell>
    </main>
  );
}
