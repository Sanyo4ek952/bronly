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
  comment: string;
  totalPrice: number;
  pricePerNight: number;
};

export type GuestRequest = OwnerRequestItem;

export type AgentRequestItem = {
  id: string;
  propertyTitle: string;
  roomTitle: string;
  guestName: string;
  createdAt: string;
  source: "agent";
  status: "new" | "accepted_by_owner" | "rejected" | "transferred_to_owner" | "completed";
  canTransferToOwner: boolean;
};
