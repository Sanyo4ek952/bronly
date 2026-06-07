import { property } from "@/entities/property/model/mock";
import type { OwnerDashboardSummary } from "@/entities/property/model/types";
import { guestRequests } from "@/entities/request/model/mock";
import { rooms } from "@/entities/room/model/mock";
import { buildOwnerPublicPath } from "@/shared/lib";

export const dashboardStats: OwnerDashboardSummary = {
  objects: 2,
  rooms: rooms.length,
  activeRooms: rooms.filter((room) => room.status === "active").length,
  newRequests: guestRequests.filter((request) => request.status === "new").length,
  publicUrl: buildOwnerPublicPath(property.slug),
  subscriptionStatus: "active",
  subscriptionStatusLabel: "Активна",
  subscriptionPlan: "Плюс",
  subscriptionValidUntil: "24 мая 2025",
  subscriptionWarningText: null,
  isCabinetRestricted: false,
  isMutationAllowed: true,
  onboarding: {
    activeStepLabel: "Активный шаг: создание объекта",
    steps: [
      {
        id: "profile",
        title: "Данные владельца",
        text: "Укажите контакты и базовые данные кабинета для работы с объектами и заявками.",
        status: "Завершено",
        state: "done",
        href: "/dashboard/settings",
        ctaLabel: "Открыть шаг",
      },
      {
        id: "property",
        title: "Создание объекта",
        text: "Добавьте первый объект размещения, чтобы подготовить витрину к показу гостям.",
        status: "Текущий шаг",
        state: "current",
        href: "/dashboard/properties/new",
        ctaLabel: "Открыть шаг",
      },
      {
        id: "room",
        title: "Первый номер",
        text: "Создайте номер и заполните основные данные, чтобы гость мог оставить заявку.",
        status: "Ожидает",
        state: "pending",
        href: "/dashboard/properties/new",
        ctaLabel: "Открыть шаг",
      },
      {
        id: "photos",
        title: "Фотографии",
        text: "Загрузите фото объекта и номера, чтобы витрина выглядела понятно и привлекательно.",
        status: "Ожидает",
        state: "pending",
        href: "/dashboard/properties/new",
        ctaLabel: "Открыть шаг",
      },
      {
        id: "public",
        title: "Публичная ссылка",
        text: "Проверьте персональную ссылку владельца и откройте страницу так, как её видит гость.",
        status: "Ожидает",
        state: "pending",
        href: "/dashboard/settings",
        ctaLabel: "Открыть шаг",
      },
    ],
  },
};
