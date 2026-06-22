import { calculateRoomPricing, normalizePublicStayFilters, type PublicStayFilters } from "@/entities/room/model/pricing";
import type { PublicRoom } from "@/entities/room/model/types";
import { formatDateLabel } from "@/shared/lib/date";

export type PublicRequestContextKind = "owner" | "agent" | "collection-owner" | "collection-agent";
export type PublicRequestErrorScope = "owner" | "agent" | "collection";

export type PublicRequestSummary = {
  imageUrl?: string;
  roomTitle: string;
  propertyTitle?: string;
  roomMeta: string;
  checkIn?: string;
  checkOut?: string;
  guestsLabel: string;
  roomsLabel: string;
  priceLabel: string;
  priceCaption: string;
  requestLabel: string;
};

export type PublicRequestSuccessStep = {
  title: string;
  description: string;
};

export type ResolvedRequestRoomSelection = {
  activeRooms: PublicRoom[];
  defaultRoomId: string;
  selectedRoom: PublicRoom | null;
  error: string;
  requestedRoomIsValid: boolean;
};

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}

function formatGuestsLabel(count: number) {
  return `${count} гост${count === 1 ? "ь" : count < 5 ? "я" : "ей"}`;
}

function formatRoomsLabel(count: number) {
  return `${count} комн.`;
}

function formatRoomMeta(room: PublicRoom) {
  return `${room.capacity} гостей • ${room.bedrooms} спальн. • ${room.area} м²`;
}

export function getPublicRequestContextMessage(kind: PublicRequestContextKind) {
  switch (kind) {
    case "agent":
    case "collection-agent":
      return "Это заявка. Агент получит её и при необходимости передаст владельцу для уточнения доступности.";
    case "collection-owner":
    case "owner":
    default:
      return "Это заявка. Владелец свяжется с вами и уточнит доступность.";
  }
}

export function getPublicRequestErrorText(scope: PublicRequestErrorScope, error: string) {
  switch (error) {
    case "room":
      return scope === "collection"
        ? "Выбранный номер больше недоступен в этой подборке. Проверьте выбор и попробуйте снова."
        : "Выбранный номер больше недоступен. Проверьте выбор и попробуйте снова.";
    case "availability":
      return "На выбранные даты у номера есть занятые даты. Выберите другой период или номер.";
    case "property":
      return scope === "collection"
        ? "Объект больше недоступен в этой подборке."
        : "Объект больше недоступен по этой ссылке.";
    case "subscription":
      return scope === "agent"
        ? "Доступ к агентской витрине временно ограничен. Новые заявки сейчас не принимаются."
        : "Новые заявки по этой ссылке сейчас не принимаются.";
    case "validation":
      return "Проверьте имя, телефон, номер и даты проживания.";
    default:
      return "Проверьте поля формы и попробуйте ещё раз.";
  }
}

export function buildPublicRequestSummary(
  room: PublicRoom,
  filtersInput: Pick<PublicStayFilters, "checkIn" | "checkOut" | "adults" | "rooms" | "hasDates">,
  propertyTitle?: string | null,
): PublicRequestSummary {
  const filters = normalizePublicStayFilters(filtersInput);
  const pricing = filters.hasDates
    ? calculateRoomPricing(room, filters.checkIn, filters.checkOut)
    : {
        nights: 0,
        displayPricePerNight: room.displayPricePerNight ?? room.pricePerNight,
        totalPrice: room.totalPrice,
      };

  return {
    imageUrl: room.photos[0]?.url,
    roomTitle: room.title,
    propertyTitle: propertyTitle ?? room.propertyTitle ?? undefined,
    roomMeta: formatRoomMeta(room),
    checkIn: filters.hasDates ? formatDateLabel(filters.checkIn) : undefined,
    checkOut: filters.hasDates ? formatDateLabel(filters.checkOut) : undefined,
    guestsLabel: formatGuestsLabel(filters.adults),
    roomsLabel: formatRoomsLabel(filters.rooms),
    priceLabel: filters.hasDates && pricing.totalPrice != null ? formatMoney(pricing.totalPrice) : `${formatMoney(pricing.displayPricePerNight)} / ночь`,
    priceCaption: filters.hasDates && pricing.nights > 0 ? `${pricing.nights} ноч.` : "Цена за ночь",
    requestLabel: "Заявка будет отправлена на конкретный номер.",
  };
}

export function findRequestRoom(rooms: PublicRoom[], roomId: string) {
  return rooms.find((room) => room.id === roomId) ?? null;
}

export function resolveRequestRoomSelection(
  rooms: PublicRoom[],
  requestedRoomId: string,
  requestedError = "",
): ResolvedRequestRoomSelection {
  const activeRooms = rooms.filter((room) => room.status === "active");
  const hasRequestedRoom = Boolean(requestedRoomId);
  const requestedRoomIsValid = hasRequestedRoom ? activeRooms.some((room) => room.id === requestedRoomId) : true;
  const defaultRoomId =
    (requestedRoomIsValid ? activeRooms.find((room) => room.id === requestedRoomId)?.id : undefined) ??
    activeRooms.find((room) => room.isAvailableForFilter)?.id ??
    activeRooms[0]?.id ??
    "";

  return {
    activeRooms,
    defaultRoomId,
    selectedRoom: findRequestRoom(rooms, defaultRoomId),
    error: requestedError || (!requestedRoomIsValid ? "room" : ""),
    requestedRoomIsValid,
  };
}

export function getPublicRequestSuccessSteps(kind: PublicRequestContextKind, contactPhone?: string | null): PublicRequestSuccessStep[] {
  const firstStep =
    kind === "agent" || kind === "collection-agent"
      ? {
          title: "Дождитесь связи с агентом",
          description: "Агент получит заявку и свяжется с вами, чтобы уточнить детали проживания.",
        }
      : {
          title: "Дождитесь связи с владельцем",
          description: "Владелец получил заявку и свяжется с вами, чтобы уточнить детали проживания.",
        };

  const steps = [
    firstStep,
    {
      title: "Уточните доступность и детали",
      description: "Согласуйте даты, состав гостей, комнаты и дополнительные условия напрямую.",
    },
  ];

  if (contactPhone) {
    steps.push({
      title: "Сохраните контакт",
      description: `На всякий случай сохраните номер ${contactPhone}.`,
    });
  }

  return steps;
}
