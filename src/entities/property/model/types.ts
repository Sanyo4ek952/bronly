import type { OwnerRoomDetail, PublicRoom } from "@/entities/room/model/types";
import type { PublicStayFilters } from "@/entities/room/model/pricing";
import type { PublicUnavailableReason } from "@/shared/lib/public-page-visibility";

export type PropertyPhoto = {
  id: string;
  url: string;
  sortOrder: number;
};

export type PublicPropertyPageData = {
  owner: {
    id: string;
    slug: string;
    displayName: string;
    phone: string;
    whatsapp: string;
    telegram: string;
  } | null;
  properties: Array<{
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
      photos: PropertyPhoto[];
      features: string[];
      houseRules: string[];
    };
    rooms: PublicRoom[];
  }>;
  filters: PublicStayFilters;
  publicUnavailableReason: PublicUnavailableReason | null;
  publicWarningText: string | null;
};

export type PublicPropertySection = PublicPropertyPageData["properties"][number];

export type PublicPropertySummary = {
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
  photos: PropertyPhoto[];
  features: string[];
  houseRules: string[];
};

export type OwnerPublicProfile = {
  id: string;
  slug: string;
  displayName: string;
  phone: string;
  whatsapp: string;
  telegram: string;
};

export type LegacyPublicProperty = {
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
  photos: PropertyPhoto[];
  features: string[];
  houseRules: string[];
};

export type DeprecatedPublicPropertyPageData = {
  property: LegacyPublicProperty | null;
  rooms: PublicRoom[];
  filters: PublicStayFilters;
  publicUnavailableReason: PublicUnavailableReason | null;
  publicWarningText: string | null;
};

export type OwnerDashboardSummary = {
  objects: number;
  rooms: number;
  activeRooms: number;
  newRequests: number;
  publicUrl: string | null;
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
  ownerPublicSlug: string | null;
  slug: string;
  title: string;
  shortTitle: string;
  propertyType: string;
  city: string;
  address: string;
  published: boolean;
  isFrozen: boolean;
  photos: PropertyPhoto[];
  coverImageUrl: string;
  roomCount: number;
  activeRoomCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OwnerPropertyDetail = {
  id: string;
  ownerId: string;
  ownerPublicSlug: string | null;
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
  photos: PropertyPhoto[];
  coverImageUrl: string;
  features: string[];
  houseRules: string[];
  rooms: OwnerRoomDetail[];
};
