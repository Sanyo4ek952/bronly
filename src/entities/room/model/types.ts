export type RoomKind = "property_room" | "standalone_room";

export type RoomLocation = {
  propertyId: string | null;
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
  allowAgentInquiries: boolean;
  allowOwnerContactSharing: boolean;
};

export type PublicRoom = {
  id: string;
  ownerId?: string;
  kind?: RoomKind;
  title: string;
  subtitle: string;
  propertyTitle?: string;
  propertySlug?: string | null;
  capacity: number;
  bedrooms: number;
  area: number;
  pricePerNight: number;
  status: "active" | "inactive";
  amenities: string[];
  seasonalPrices?: OwnerSeasonalPrice[];
  busyRanges?: OwnerBusyRange[];
  agentMarkupPercent?: number;
  isAvailableForFilter?: boolean;
  unavailableReason?: string;
  nights?: number;
  displayPricePerNight?: number;
  totalPrice?: number;
  photos: RoomPhoto[];
  location?: RoomLocation;
  nightlyPrices?: Array<{
    date: string;
    pricePerNight: number;
    source: "base" | "seasonal";
    seasonalPriceId?: string;
  }>;
};

export type Room = PublicRoom;

export type RoomPhoto = {
  id: string;
  url: string;
  sortOrder: number;
};

export type OwnerSeasonalPrice = {
  id: string;
  roomId: string;
  startsOn: string;
  endsOn: string;
  pricePerNight: number;
  isActive: boolean;
};

export type OwnerBusyRange = {
  id: string;
  roomId: string;
  startsOn: string;
  endsOn: string;
  source: string;
  label: string;
  note: string;
};

export type OwnerRoomListItem = {
  id: string;
  ownerId: string;
  kind: RoomKind;
  propertyId: string | null;
  slug: string;
  title: string;
  subtitle: string;
  propertyTitle: string;
  propertySlug: string | null;
  capacity: number;
  bedrooms: number;
  area: number;
  pricePerNight: number;
  isActive: boolean;
  photos: RoomPhoto[];
  amenities: string[];
  seasonalPrices: OwnerSeasonalPrice[];
  busyRanges: OwnerBusyRange[];
  location: RoomLocation;
};

export type OwnerRoomDetail = OwnerRoomListItem;
