export type OwnerRequestItem = {
  id: string;
  guestName: string;
  phone: string;
  createdAt: string;
  roomId: string;
  propertyTitle: string;
  roomTitle: string;
  source: "owner" | "agent" | "collection";
  status: "new" | "accepted_by_owner" | "rejected" | "transferred_to_owner" | "completed";
  checkIn: string;
  checkOut: string;
  guestsLabel: string;
  roomsCount: number;
  comment: string;
  totalPrice: number;
  quotedPricePerNight: number;
  basePricePerNight: number;
  completionRequestedAt: string | null;
};

export type GuestRequest = OwnerRequestItem;

export type AgentRequestItem = {
  id: string;
  propertyTitle: string;
  roomTitle: string;
  guestName: string;
  createdAt: string;
  source: "agent" | "collection";
  status: "new" | "accepted_by_owner" | "rejected" | "transferred_to_owner" | "completed";
  guestsLabel: string;
  roomsCount: number;
  totalPrice: number;
  quotedPricePerNight: number;
  canTransferToOwner: boolean;
  canRequestCompletion: boolean;
  completionRequestedAt: string | null;
};
