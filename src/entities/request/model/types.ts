export type OwnerRequestItem = {
  id: string;
  guestName: string;
  phone: string;
  createdAt: string;
  roomId: string;
  status: "new" | "in_progress" | "confirmed" | "declined";
  checkIn: string;
  checkOut: string;
  guestsLabel: string;
  comment: string;
  totalPrice: number;
};

export type GuestRequest = OwnerRequestItem;

export type AgentRequestItem = {
  id: string;
  propertyTitle: string;
  guestName: string;
  createdAt: string;
  status: string;
};
