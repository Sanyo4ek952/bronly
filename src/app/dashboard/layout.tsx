import { redirect } from "next/navigation";

import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile, getPrimaryRole } from "@/shared/api/supabase";
import { OwnerShell } from "@/widgets/owner-shell";

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

  const subscription = await getSubscriptionRuntimeState(profile.id, "owner");

  const roleLabel = profile.roles.includes("agent") && !profile.roles.includes("owner")
    ? "Агент"
    : profile.roles.includes("admin")
      ? "Администратор"
      : "Владелец";

  const notice = subscription.status === "expired"
    ? {
        title: "Доступ к публичным страницам ограничен",
        text: "Подписка не продлена. Публичные страницы и новые заявки временно недоступны, пока администратор не продлит доступ.",
      }
    : subscription.showGraceWarning
      ? {
          title: "Подписку нужно продлить",
          text: "Пробный период закончился. У вас есть 3 дня, чтобы оплатить подписку и сохранить доступ к публичным страницам и заявкам.",
        }
      : null;

  return (
    <main className="br-page br-page--dashboard">
      <div className="br-container br-dashboard-layout">
        <OwnerShell userName={profile.displayName} roleLabel={roleLabel} notice={notice}>
          {children}
        </OwnerShell>
      </div>
    </main>
  );
}
