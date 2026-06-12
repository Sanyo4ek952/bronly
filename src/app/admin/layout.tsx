import { redirect } from "next/navigation";

import { getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { AdminShell } from "@/widgets/admin-dashboard";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.roles.includes("admin")) {
    redirect(getPostLoginRedirect(profile.roles));
  }

  return (
    <main className="br-page br-page--dashboard">
      <div className="br-container br-dashboard-layout">
        <AdminShell userName={profile.displayName}>{children}</AdminShell>
      </div>
    </main>
  );
}
