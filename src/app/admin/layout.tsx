import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { createRobots } from "@/shared/lib/seo";
import { AdminShell } from "@/widgets/admin-dashboard";

export const metadata: Metadata = {
  robots: createRobots(false),
};

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
    <main className="min-h-screen bg-[var(--background)] pb-[var(--safe-area-bottom)] max-[1080px]:min-h-dvh">
      <div className="mx-auto w-[calc(100%-32px)] max-w-[1440px] max-[1080px]:flex max-[1080px]:min-h-full max-[640px]:w-[calc(100%-24px)]">
        <AdminShell userName={profile.displayName}>{children}</AdminShell>
      </div>
    </main>
  );
}
