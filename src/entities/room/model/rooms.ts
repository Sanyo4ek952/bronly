import type { Room } from "./types";

export const rooms: Room[] = [
  {
    id: "room-1",
    name: "Номер 1",
    shortName: "1",
    description: "Номер 1",
    accentClass: "bg-sage-600",
  },
  {
    id: "room-2",
    name: "Номер 2",
    shortName: "2",
    description: "Номер 2",
    accentClass: "bg-[#3f6f9f]",
  },
  {
    id: "room-3",
    name: "Номер 3",
    shortName: "3",
    description: "Номер 3",
    accentClass: "bg-[#936f45]",
  },
  {
    id: "room-4",
    name: "Номер 4",
    shortName: "4",
    description: "Номер 4",
    accentClass: "bg-[#7a6d9c]",
  },
];

export const roomById = new Map(rooms.map((room) => [room.id, room]));
