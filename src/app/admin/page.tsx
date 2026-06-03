import { redirect } from "next/navigation";

import { getAdminDashboardData } from "@/entities/admin";
import { getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { AdminDashboard } from "@/widgets/admin-dashboard";

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.roles.includes("admin")) {
    redirect(getPostLoginRedirect(profile.roles));
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const success = getSearchString(params, "success");
  const error = getSearchString(params, "error");
  const data = await getAdminDashboardData();

  const message = success
    ? success === "subscription-extended"
      ? "Подписка продлена на 30 дней."
      : success === "subscription-saved"
        ? "Подписка обновлена."
        : success === "property-frozen"
          ? "Объект заморожен."
          : "Объект разморожен."
    : error
      ? "Не удалось выполнить действие. Проверьте данные и попробуйте еще раз."
      : "";

  return <AdminDashboard data={data} message={message} />;
}
