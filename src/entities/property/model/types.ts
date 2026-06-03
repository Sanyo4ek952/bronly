import type { OwnerRoomDetail, PublicRoom } from "@/entities/room/model/types";
import type { PublicStayFilters } from "@/entities/room/model/pricing";

export type PublicPropertyPageData = {
  property: {
    id: string;
    title: string;
    shortTitle: string;
    slug: string;
    propertyType: string;
    city: string;
    address: string;
    timezone: string;
    shortDescription: string;
    fullDescription: string;
    phone: string;
    whatsapp: string;
    telegram: string;
    checkInTime: string;
    checkOutTime: string;
    features: string[];
    houseRules: string[];
  } | null;
  rooms: PublicRoom[];
  filters: PublicStayFilters;
  publicUnavailableReason: "subscription_expired" | null;
  publicWarningText: string | null;
};

export type OwnerDashboardSummary = {
  objects: number;
  rooms: number;
  activeRooms: number;
  newRequests: number;
  publicUrl: string;
  subscriptionStatus: string;
  subscriptionStatusLabel: string;
  subscriptionPlan: string;
  subscriptionValidUntil: string;
  subscriptionWarningText: string | null;
  isCabinetRestricted: boolean;
  isMutationAllowed: boolean;
};

export type OwnerPropertyListItem = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  propertyType: string;
  city: string;
  address: string;
  published: boolean;
  isFrozen: boolean;
  coverImageUrl: string;
  roomCount: number;
  activeRoomCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OwnerPropertyDetail = {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  shortTitle: string;
  propertyType: string;
  city: string;
  address: string;
  timezone: string;
  shortDescription: string;
  fullDescription: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  checkInTime: string;
  checkOutTime: string;
  published: boolean;
  isFrozen: boolean;
  allowAgentInquiries: boolean;
  allowOwnerContactSharing: boolean;
  coverImageUrl: string;
  features: string[];
  houseRules: string[];
  rooms: OwnerRoomDetail[];
};
