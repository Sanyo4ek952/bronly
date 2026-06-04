import type { Room } from "@/entities/room/model/types";

export const rooms: Room[] = [
  {
    id: "room-1",
    title: "Р›СЋРєСЃ СЃ РІРёРґРѕРј РЅР° РјРѕСЂРµ",
    subtitle: "Р›СЋРєСЃ",
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
    amenities: ["Wi-Fi", "Р’РёРґ РЅР° РјРѕСЂРµ", "Р‘Р°Р»РєРѕРЅ"],
  },
  {
    id: "room-2",
    title: "РЎРµРјРµР№РЅС‹Р№ РЅРѕРјРµСЂ",
    subtitle: "РЎРµРјРµР№РЅС‹Р№",
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
    amenities: ["Wi-Fi", "2 СЃРїР°Р»СЊРЅРё", "РљСѓС…РЅСЏ"],
  },
  {
    id: "room-3",
    title: "РЎС‚Р°РЅРґР°СЂС‚ СЃ Р±Р°Р»РєРѕРЅРѕРј",
    subtitle: "РЎС‚Р°РЅРґР°СЂС‚",
    capacity: 2,
    bedrooms: 1,
    area: 25,
    pricePerNight: 3900,
    status: "active",
    photos: [],
    amenities: ["Wi-Fi", "Р‘Р°Р»РєРѕРЅ", "РўР’"],
  },
  {
    id: "room-4",
    title: "РЎС‚Р°РЅРґР°СЂС‚",
    subtitle: "РЎС‚Р°РЅРґР°СЂС‚",
    capacity: 2,
    bedrooms: 1,
    area: 20,
    pricePerNight: 3200,
    status: "inactive",
    photos: [],
    amenities: ["Wi-Fi", "РўР’"],
  },
  {
    id: "room-5",
    title: "РђРїР°СЂС‚Р°РјРµРЅС‚С‹ СЃ РєСѓС…РЅРµР№",
    subtitle: "РђРїР°СЂС‚Р°РјРµРЅС‚С‹",
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
    amenities: ["РљСѓС…РЅСЏ", "Wi-Fi", "Р—РѕРЅР° РѕС‚РґС‹С…Р°"],
  },
];

export function formatRoomMeta(room: Room) {
  return `${room.capacity} РіРѕСЃС‚СЏ вЂў ${room.bedrooms} СЃРїР°Р»СЊРЅСЏ вЂў ${room.area} РјВІ`;
}

export function formatRoomPrice(room: Room) {
  return `РѕС‚ ${room.pricePerNight.toLocaleString("ru-RU")} в‚Ѕ / РЅРѕС‡СЊ`;
}

export function getRoomById(roomId: string) {
  return rooms.find((room) => room.id === roomId);
}
