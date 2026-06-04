import type { Room } from "@/entities/room/model/types";

export const rooms: Room[] = [
  {
    id: "room-1",
    title: "Люкс с видом на море",
    subtitle: "Люкс",
    capacity: 2,
    bedrooms: 1,
    area: 45,
    pricePerNight: 8900,
    status: "active",
    photos: [
      {
        id: "room-1-photo-1",
        url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
        sortOrder: 0,
      },
    ],
    amenities: ["Wi-Fi", "Вид на море", "Балкон"],
  },
  {
    id: "room-2",
    title: "Семейный номер",
    subtitle: "Семейный",
    capacity: 4,
    bedrooms: 2,
    area: 40,
    pricePerNight: 6200,
    status: "active",
    photos: [
      {
        id: "room-2-photo-1",
        url: "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=900&q=80",
        sortOrder: 0,
      },
    ],
    amenities: ["Wi-Fi", "2 спальни", "Кухня"],
  },
  {
    id: "room-3",
    title: "Стандарт с балконом",
    subtitle: "Стандарт",
    capacity: 2,
    bedrooms: 1,
    area: 25,
    pricePerNight: 3900,
    status: "active",
    photos: [],
    amenities: ["Wi-Fi", "Балкон", "ТВ"],
  },
  {
    id: "room-4",
    title: "Стандарт",
    subtitle: "Стандарт",
    capacity: 2,
    bedrooms: 1,
    area: 20,
    pricePerNight: 3200,
    status: "inactive",
    photos: [],
    amenities: ["Wi-Fi", "ТВ"],
  },
  {
    id: "room-5",
    title: "Апартаменты с кухней",
    subtitle: "Апартаменты",
    capacity: 3,
    bedrooms: 1,
    area: 40,
    pricePerNight: 5500,
    status: "active",
    photos: [
      {
        id: "room-5-photo-1",
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
        sortOrder: 0,
      },
    ],
    amenities: ["Кухня", "Wi-Fi", "Зона отдыха"],
  },
];

export function formatRoomMeta(room: Room) {
  return `${room.capacity} гостя • ${room.bedrooms} спальня • ${room.area} м²`;
}

export function formatRoomPrice(room: Room) {
  return `от ${room.pricePerNight.toLocaleString("ru-RU")} ₽ / ночь`;
}

export function getRoomById(roomId: string) {
  return rooms.find((room) => room.id === roomId);
}
