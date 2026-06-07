import type { PublicUnavailableReason } from "@/shared/lib/public-page-visibility";

export type CollectionRole = "owner" | "agent";

export type CollectionSummary = {
  id: string;
  title: string;
  slug: string;
  isArchived: boolean;
  itemCount: number;
  viewsCount: number;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CollectionItem = {
  id: string;
  kind: "property" | "room";
  propertyId: string | null;
  roomId: string | null;
  sortOrder: number;
  title: string;
  subtitle: string;
  createdAt: string;
};

export type CollectionAccessCandidate = {
  id: string;
  title: string;
  subtitle: string;
  scope: "own" | "collaboration";
};

export type CollectionChoice = CollectionAccessCandidate & {
  isSelected: boolean;
};

export type CollectionManagementData = {
  role: CollectionRole;
  collections: CollectionSummary[];
  selectedCollection: CollectionSummary | null;
  items: CollectionItem[];
  availableProperties: CollectionAccessCandidate[];
  availableRooms: CollectionAccessCandidate[];
};

export type CollectionListData = {
  role: CollectionRole;
  collections: CollectionSummary[];
};

export type CollectionDetailData = {
  role: CollectionRole;
  collection: CollectionSummary | null;
  items: CollectionItem[];
  availableProperties: CollectionAccessCandidate[];
  availableRooms: CollectionAccessCandidate[];
  propertyChoices: CollectionChoice[];
  roomChoices: CollectionChoice[];
};

export type PublicCollectionContact = {
  role: CollectionRole;
  id: string;
  slug: string;
  displayName: string;
  phone: string;
  whatsapp: string;
  telegram: string;
};

export type PublicCollectionSection = {
  property: {
    id: string;
    slug: string;
    title: string;
    shortTitle: string;
    city: string;
    address: string;
    photos: import("@/entities/property").PropertyPhoto[];
  };
  rooms: import("@/entities/room").PublicRoom[];
  sourceKinds: Array<"property" | "room">;
};

export type PublicCollectionStandaloneRoomItem = {
  room: import("@/entities/room").PublicRoom;
  sourceKinds: Array<"property" | "room">;
};

export type PublicCollectionPageData = {
  collection: {
    id: string;
    slug: string;
    title: string;
    guestLabel: string;
    creatorRole: CollectionRole;
  } | null;
  contact: PublicCollectionContact | null;
  sections: PublicCollectionSection[];
  standaloneRooms: PublicCollectionStandaloneRoomItem[];
  filters: import("@/entities/room").PublicStayFilters;
  publicUnavailableReason: PublicUnavailableReason | null;
  publicWarningText: string | null;
};
