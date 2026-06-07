import { cache } from "react";

import { dashboardStats } from "@/entities/property/model/dashboard";
import type { OwnerDashboardSummary } from "@/entities/property/model/types";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { canUseSupabase } from "@/shared/api/supabase/server";
import type { AuthProfile } from "@/shared/api/supabase/server-auth";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import { buildOwnerPublicPath } from "@/shared/lib";
import { formatDateLabel } from "@/shared/lib/date";

type OwnerOnboardingStep = OwnerDashboardSummary["onboarding"]["steps"][number];

function shouldOwnerSeeRequestAsNew(request: {
  owner_id: string;
  agent_id: string | null;
  source: "owner" | "agent" | "collection";
  status: "new" | "accepted_by_owner" | "rejected" | "transferred_to_owner" | "completed";
}) {
  return !request.agent_id || request.agent_id === request.owner_id || request.source === "owner";
}

function getSubscriptionWarningText(input: { status: string; graceEndsAt: string | null }) {
  if (input.status === "grace") {
    return input.graceEndsAt
      ? `РџРѕРґРїРёСЃРєСѓ РЅСѓР¶РЅРѕ РїСЂРѕРґР»РёС‚СЊ РґРѕ ${formatDateLabel(input.graceEndsAt)}. Р”Рѕ СЌС‚РѕР№ РґР°С‚С‹ РїСѓР±Р»РёС‡РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ Рё РЅРѕРІС‹Рµ Р·Р°СЏРІРєРё РµС‰Рµ РґРѕСЃС‚СѓРїРЅС‹.`
      : "РџРѕРґРїРёСЃРєСѓ РЅСѓР¶РЅРѕ РїСЂРѕРґР»РёС‚СЊ. РџРѕРєР° grace period РЅРµ Р·Р°РєРѕРЅС‡РёР»СЃСЏ, РїСѓР±Р»РёС‡РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ Рё РЅРѕРІС‹Рµ Р·Р°СЏРІРєРё РµС‰Рµ РґРѕСЃС‚СѓРїРЅС‹.";
  }

  if (input.status === "expired") {
    return "РџСѓР±Р»РёС‡РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ Рё РЅРѕРІС‹Рµ Р·Р°СЏРІРєРё РІСЂРµРјРµРЅРЅРѕ РѕРіСЂР°РЅРёС‡РµРЅС‹ РґРѕ СЂСѓС‡РЅРѕРіРѕ РїСЂРѕРґР»РµРЅРёСЏ РїРѕРґРїРёСЃРєРё. РљР°Р±РёРЅРµС‚ РґРѕСЃС‚СѓРїРµРЅ РґР»СЏ РїСЂРѕСЃРјРѕС‚СЂР°, РЅРѕ РёР·РјРµРЅРµРЅРёСЏ РґР°РЅРЅС‹С… РѕСЃС‚Р°РЅРѕРІР»РµРЅС‹.";
  }

  return null;
}

function getOnboardingStatus(state: OwnerOnboardingStep["state"]) {
  if (state === "done") {
    return "Завершено";
  }

  if (state === "current") {
    return "Текущий шаг";
  }

  return "Ожидает";
}

function getOnboardingStepText(stepId: OwnerOnboardingStep["id"]) {
  switch (stepId) {
    case "profile":
      return "Укажите контакты и базовые данные кабинета для работы с объектами и заявками.";
    case "property":
      return "Добавьте первый объект размещения, чтобы подготовить витрину к показу гостям.";
    case "room":
      return "Создайте номер и заполните основные данные, чтобы гость мог оставить заявку.";
    case "photos":
      return "Загрузите фото объекта и номера, чтобы витрина выглядела понятно и привлекательно.";
    case "public":
      return "Проверьте персональную ссылку владельца и откройте страницу так, как её видит гость.";
    default:
      return "";
  }
}

function getStepState(isDone: boolean, isCurrent: boolean): OwnerOnboardingStep["state"] {
  if (isDone) {
    return "done";
  }

  if (isCurrent) {
    return "current";
  }

  return "pending";
}

function buildOwnerOnboarding(input: {
  profile: AuthProfile;
  publicUrl: string | null;
  firstProperty: { id: string; roomCount: number; photoCount: number } | null;
}) {
  const hasProfile = Boolean(input.profile.displayName.trim() && input.profile.phone.trim());
  const hasProperty = Boolean(input.firstProperty);
  const hasRoom = Boolean(input.firstProperty?.roomCount);
  const hasPhotos = Boolean(input.firstProperty?.photoCount);
  const hasPublicUrl = Boolean(input.publicUrl);

  const currentStepId: OwnerOnboardingStep["id"] | null = !hasProfile
    ? "profile"
    : !hasProperty
      ? "property"
      : !hasRoom
        ? "room"
        : !hasPhotos
          ? "photos"
          : !hasPublicUrl
            ? "public"
            : null;

  const propertyHref = input.firstProperty ? `/dashboard/properties/${input.firstProperty.id}` : "/dashboard/properties/new";
  const roomHref = input.firstProperty ? `/dashboard/properties/${input.firstProperty.id}/rooms/new` : "/dashboard/properties/new";
  const photosHref = input.firstProperty ? `/dashboard/properties/${input.firstProperty.id}#photos` : "/dashboard/properties/new";

  const steps: OwnerOnboardingStep[] = [
    {
      id: "profile",
      title: "Данные владельца",
      text: getOnboardingStepText("profile"),
      state: getStepState(hasProfile, currentStepId === "profile"),
      status: getOnboardingStatus(getStepState(hasProfile, currentStepId === "profile")),
      href: "/dashboard/settings",
      ctaLabel: "Открыть шаг",
    },
    {
      id: "property",
      title: "Создание объекта",
      text: getOnboardingStepText("property"),
      state: getStepState(hasProperty, currentStepId === "property"),
      status: getOnboardingStatus(getStepState(hasProperty, currentStepId === "property")),
      href: propertyHref,
      ctaLabel: "Открыть шаг",
    },
    {
      id: "room",
      title: "Первый номер",
      text: getOnboardingStepText("room"),
      state: getStepState(hasRoom, currentStepId === "room"),
      status: getOnboardingStatus(getStepState(hasRoom, currentStepId === "room")),
      href: roomHref,
      ctaLabel: "Открыть шаг",
    },
    {
      id: "photos",
      title: "Фотографии",
      text: getOnboardingStepText("photos"),
      state: getStepState(hasPhotos, currentStepId === "photos"),
      status: getOnboardingStatus(getStepState(hasPhotos, currentStepId === "photos")),
      href: photosHref,
      ctaLabel: "Открыть шаг",
    },
    {
      id: "public",
      title: "Публичная ссылка",
      text: getOnboardingStepText("public"),
      state: getStepState(hasPublicUrl, currentStepId === "public"),
      status: getOnboardingStatus(getStepState(hasPublicUrl, currentStepId === "public")),
      href: input.publicUrl ?? "/dashboard/settings",
      ctaLabel: "Открыть шаг",
    },
  ];

  return {
    activeStepLabel: currentStepId
      ? `Активный шаг: ${steps.find((step) => step.id === currentStepId)?.title.toLowerCase() ?? "онбординг"}`
      : "Витрина готова: можно принимать заявки.",
    steps,
  };
}

export const getOwnerDashboardSummary = cache(async (): Promise<OwnerDashboardSummary> => {
  if (!canUseSupabase()) {
    return dashboardStats;
  }

  try {
    const profile = await getCurrentAuthProfile();

    if (!profile) {
      return dashboardStats;
    }

    const supabase = await createSupabaseServerClient();
    const { data: propertyRows } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: true });

    const subscription = await getSubscriptionRuntimeState(profile.id, "owner");
    const publicUrl = buildOwnerPublicPath(profile.slug);

    if (!(propertyRows ?? []).length) {
      return {
        objects: 0,
        rooms: 0,
        activeRooms: 0,
        newRequests: 0,
        publicUrl,
        subscriptionStatus: subscription.status,
        subscriptionStatusLabel: subscription.statusLabel,
        subscriptionPlan: subscription.planName,
        subscriptionValidUntil: subscription.validUntil
          ? formatDateLabel(subscription.validUntil)
          : dashboardStats.subscriptionValidUntil,
        subscriptionWarningText: getSubscriptionWarningText(subscription),
        isCabinetRestricted: subscription.isCabinetRestricted,
        isMutationAllowed: subscription.isMutationAllowed,
        onboarding: buildOwnerOnboarding({
          profile,
          publicUrl,
          firstProperty: null,
        }),
      };
    }

    const propertyIds = (propertyRows ?? []).map((row) => row.id);
    const [{ count: objectCount }, { data: roomRows }, { data: newRequestRows }, { data: propertyPhotoRows }] = await Promise.all([
      supabase.from("properties").select("*", { count: "exact", head: true }).eq("owner_id", profile.id),
      supabase.from("rooms").select("id, property_id, is_active").in("property_id", propertyIds),
      supabase
        .from("guest_requests")
        .select("owner_id, agent_id, source, status")
        .eq("owner_id", profile.id)
        .eq("status", "new"),
      supabase.from("property_photos").select("property_id").in("property_id", propertyIds),
    ]);

    const safeRoomRows = (roomRows ?? []) as Array<{ property_id: string; is_active: boolean }>;
    const activeRooms = safeRoomRows.filter((room) => room.is_active).length;
    const roomCountByProperty = new Map<string, number>();
    const photoCountByProperty = new Map<string, number>();

    for (const room of safeRoomRows) {
      roomCountByProperty.set(room.property_id, (roomCountByProperty.get(room.property_id) ?? 0) + 1);
    }

    for (const photo of (propertyPhotoRows ?? []) as Array<{ property_id: string }>) {
      photoCountByProperty.set(photo.property_id, (photoCountByProperty.get(photo.property_id) ?? 0) + 1);
    }

    const firstPropertyRow = (propertyRows ?? [])[0];

    return {
      objects: objectCount ?? propertyRows?.length ?? dashboardStats.objects,
      rooms: safeRoomRows.length,
      activeRooms,
      newRequests:
        ((newRequestRows ?? []) as Array<{
          owner_id: string;
          agent_id: string | null;
          source: "owner" | "agent" | "collection";
          status: "new" | "accepted_by_owner" | "rejected" | "transferred_to_owner" | "completed";
        }>).filter(shouldOwnerSeeRequestAsNew).length,
      publicUrl,
      subscriptionStatus: subscription.status,
      subscriptionStatusLabel: subscription.statusLabel,
      subscriptionPlan: subscription.planName,
      subscriptionValidUntil: subscription.validUntil
        ? formatDateLabel(subscription.validUntil)
        : dashboardStats.subscriptionValidUntil,
      subscriptionWarningText: getSubscriptionWarningText(subscription),
      isCabinetRestricted: subscription.isCabinetRestricted,
      isMutationAllowed: subscription.isMutationAllowed,
      onboarding: buildOwnerOnboarding({
        profile,
        publicUrl,
        firstProperty: firstPropertyRow
          ? {
              id: firstPropertyRow.id,
              roomCount: roomCountByProperty.get(firstPropertyRow.id) ?? 0,
              photoCount: photoCountByProperty.get(firstPropertyRow.id) ?? 0,
            }
          : null,
      }),
    };
  } catch {
    return dashboardStats;
  }
});
