import { property } from "@/entities/property/model/mock";
import { guestRequests } from "@/entities/request/model/mock";
import { rooms } from "@/entities/room/model/mock";

export const dashboardStats = {
  objects: 2,
  rooms: rooms.length,
  activeRooms: rooms.filter((room) => room.status === "active").length,
  newRequests: guestRequests.filter((request) => request.status === "new").length,
  publicUrl: `bronly.ru/u/${property.id}`,
  subscriptionStatus: "active",
  subscriptionStatusLabel: "Активна",
  subscriptionPlan: "Плюс",
  subscriptionValidUntil: "24 мая 2025",
  subscriptionWarningText: null,
  isCabinetRestricted: false,
  isMutationAllowed: true,
};
