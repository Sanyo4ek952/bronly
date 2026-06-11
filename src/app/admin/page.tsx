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

  let message = "";

  if (success === "subscription-extended") {
    message = "РџРѕРґРїРёСЃРєР° РїСЂРѕРґР»РµРЅР° РЅР° 30 РґРЅРµР№.";
  } else if (success === "subscription-saved") {
    message = "РџРѕРґРїРёСЃРєР° РѕР±РЅРѕРІР»РµРЅР°.";
  } else if (success === "profile-hidden") {
    message = "РџСѓР±Р»РёС‡РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ РїСЂРѕС„РёР»СЏ СЃРєСЂС‹С‚С‹ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂРѕРј.";
  } else if (success === "profile-unhidden") {
    message = "РџСѓР±Р»РёС‡РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ РїСЂРѕС„РёР»СЏ СЃРЅРѕРІР° РґРѕСЃС‚СѓРїРЅС‹.";
  } else if (success === "property-frozen") {
    message = "РћР±СЉРµРєС‚ Р·Р°РјРѕСЂРѕР¶РµРЅ.";
  } else if (success === "property-unfrozen") {
    message = "РћР±СЉРµРєС‚ СЂР°Р·РјРѕСЂРѕР¶РµРЅ.";
  } else if (success === "referral-approved") {
    message = "Р РµС„РµСЂР°Р»СЊРЅРѕРµ РїСЂРѕРґР»РµРЅРёРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРѕ.";
  } else if (success === "referral-rejected") {
    message = "Р РµС„РµСЂР°Р»СЊРЅРѕРµ РЅР°С‡РёСЃР»РµРЅРёРµ РѕС‚РєР»РѕРЅРµРЅРѕ.";
  } else if (error) {
    message = "РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹РїРѕР»РЅРёС‚СЊ РґРµР№СЃС‚РІРёРµ. РџСЂРѕРІРµСЂСЊС‚Рµ РґР°РЅРЅС‹Рµ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р·.";
  }

  return <AdminDashboard data={data} message={message} />;
}
