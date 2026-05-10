export type RoomId = "room-1" | "room-2" | "room-3" | "room-4";

export type Room = {
  id: RoomId;
  name: string;
  shortName: string;
  description: string;
  accentClass: string;
};
