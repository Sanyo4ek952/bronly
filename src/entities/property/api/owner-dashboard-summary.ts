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
      ? `Подписку нужно продлить до ${formatDateLabel(input.graceEndsAt)}. До этой даты публичные страницы и новые заявки еще доступны.`
      : "Подписку нужно продлить. Пока grace period не закончился, публичные страницы и новые заявки еще доступны.";
  }

  if (input.status === "expired") {
    return "Публичные страницы и новые заявки временно ограничены до ручного продления подписки.";
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
      return "Укажите контакты и базовые данные кабинета для работы с объектами, номерами и заявками.";
    case "property":
      return "Создайте первый объект или отдельный номер, чтобы подготовить витрину к показу гостям.";
    case "room":
      return "Добавьте номер в объект или заполните данные отдельного номера, чтобы гость мог оставить заявку.";
    case "photos":
      return "Загрузите фотографии объекта или номера, чтобы витрина выглядела понятной и привлекательной.";
    case "public":
      return "Проверьте персональную ссылку владельца и откройте страницу так, как ее видит гость.";
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
  firstPropertyId: string | null;
  hasProperty: boolean;
  hasStandaloneRoom: boolean;
  hasRoom: boolean;
  hasPhotos: boolean;
}) {
  const hasProfile = Boolean(input.profile.displayName.trim() && input.profile.phone.trim());
  const hasInventory = input.hasProperty || input.hasStandaloneRoom;
  const hasPublicUrl = Boolean(input.publicUrl);

  const currentStepId: OwnerOnboardingStep["id"] | null = !hasProfile
    ? "profile"
    : !hasInventory
      ? "property"
      : !input.hasRoom
        ? "room"
        : !input.hasPhotos
          ? "photos"
          : !hasPublicUrl
            ? "public"
            : null;

  const propertyHref = input.firstPropertyId ? `/dashboard/properties/${input.firstPropertyId}` : "/dashboard/properties";
  const roomHref = input.firstPropertyId ? `/dashboard/properties/${input.firstPropertyId}/rooms/new` : "/dashboard/rooms/new";
  const photosHref = input.firstPropertyId ? `/dashboard/properties/${input.firstPropertyId}` : "/dashboard/rooms";

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
      title: "Первый вариант размещения",
      text: getOnboardingStepText("property"),
      state: getStepState(hasInventory, currentStepId === "property"),
      status: getOnboardingStatus(getStepState(hasInventory, currentStepId === "property")),
      href: "/dashboard/properties",
      ctaLabel: "Открыть шаг",
    },
    {
      id: "room",
      title: "Первый номер",
      text: getOnboardingStepText("room"),
      state: getStepState(input.hasRoom, currentStepId === "room"),
      status: getOnboardingStatus(getStepState(input.hasRoom, currentStepId === "room")),
      href: roomHref,
      ctaLabel: "Открыть шаг",
    },
    {
      id: "photos",
      title: "Фотографии",
      text: getOnboardingStepText("photos"),
      state: getStepState(input.hasPhotos, currentStepId === "photos"),
      status: getOnboardingStatus(getStepState(input.hasPhotos, currentStepId === "photos")),
      href: photosHref,
      ctaLabel: "Открыть шаг",
    },
    {
      id: "public",
      title: "Публичная ссылка",
      text: getOnboardingStepText("public"),
      state: getStepState(hasPublicUrl, currentStepId === "public"),
      status: getOnboardingStatus(getStepState(hasPublicUrl, currentStepId === "public")),
      href: input.publicUrl ?? propertyHref,
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
    const [propertyRowsResult, roomRowsResult, newRequestRowsResult, propertyPhotoRowsResult, roomPhotoRowsResult] = await Promise.all([
      supabase.from("properties").select("id").eq("owner_id", profile.id).order("created_at", { ascending: true }),
      supabase
        .from("rooms")
        .select("id, property_id, room_kind, is_active")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: true }),
      supabase.from("guest_requests").select("owner_id, agent_id, source, status").eq("owner_id", profile.id).eq("status", "new"),
      supabase.from("property_photos").select("property_id"),
      supabase.from("room_photos").select("room_id"),
    ]);

    const propertyRows = (propertyRowsResult.data ?? []) as Array<{ id: string }>;
    const roomRows = (roomRowsResult.data ?? []) as Array<{
      id: string;
      property_id: string | null;
      room_kind: "property_room" | "standalone_room";
      is_active: boolean;
    }>;
    const propertyIds = propertyRows.map((row) => row.id);
    const roomIds = roomRows.map((row) => row.id);
    const propertyPhotoRows = (propertyPhotoRowsResult.data ?? []) as Array<{ property_id: string }>;
    const roomPhotoRows = (roomPhotoRowsResult.data ?? []) as Array<{ room_id: string }>;
    const subscription = await getSubscriptionRuntimeState(profile.id, "owner");
    const publicUrl = buildOwnerPublicPath(profile.slug);

    const activeRooms = roomRows.filter((room) => room.is_active).length;
    const photoPropertyIds = new Set(
      propertyPhotoRows.filter((row) => propertyIds.includes(row.property_id)).map((row) => row.property_id),
    );
    const photoRoomIds = new Set(roomPhotoRows.filter((row) => roomIds.includes(row.room_id)).map((row) => row.room_id));
    const hasProperty = propertyRows.length > 0;
    const hasStandaloneRoom = roomRows.some((room) => room.room_kind === "standalone_room");
    const hasRoom = roomRows.length > 0;
    const hasPhotos = photoPropertyIds.size > 0 || photoRoomIds.size > 0;

    return {
      objects: propertyRows.length,
      rooms: roomRows.length,
      activeRooms,
      newRequests:
        ((newRequestRowsResult.data ?? []) as Array<{
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
        firstPropertyId: propertyRows[0]?.id ?? null,
        hasProperty,
        hasStandaloneRoom,
        hasRoom,
        hasPhotos,
      }),
    };
  } catch {
    return dashboardStats;
  }
});
