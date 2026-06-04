export type PublicRoom = {
  id: string;
  title: string;
  subtitle: string;
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
  propertyId: string;
  slug: string;
  title: string;
  subtitle: string;
  capacity: number;
  bedrooms: number;
  area: number;
  pricePerNight: number;
  isActive: boolean;
  photos: RoomPhoto[];
  amenities: string[];
  seasonalPrices: OwnerSeasonalPrice[];
  busyRanges: OwnerBusyRange[];
};

export type OwnerRoomDetail = OwnerRoomListItem;
