import type { OwnerBusyRange, OwnerSeasonalPrice, PublicRoom } from "@/entities/room/model/types";

export type PublicStayFilters = {
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
  hasDates: boolean;
};

type PricingRoom = {
  id: string;
  pricePerNight: number;
  capacity: number;
  bedrooms: number;
  seasonalPrices?: OwnerSeasonalPrice[];
  busyRanges?: OwnerBusyRange[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string) {
  if (!DATE_RE.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function normalizePublicStayFilters(input: {
  checkIn?: string;
  checkOut?: string;
  adults?: string | number;
  rooms?: string | number;
}): PublicStayFilters {
  const checkInDate = parseDate(typeof input.checkIn === "string" ? input.checkIn : "");
  const checkOutDate = parseDate(typeof input.checkOut === "string" ? input.checkOut : "");
  const hasDates = Boolean(checkInDate && checkOutDate && checkInDate.getTime() < checkOutDate.getTime());

  const adultsRaw = typeof input.adults === "number" ? input.adults : Number.parseInt(input.adults ?? "", 10);
  const roomsRaw = typeof input.rooms === "number" ? input.rooms : Number.parseInt(input.rooms ?? "", 10);

  return {
    checkIn: hasDates && checkInDate ? toDateString(checkInDate) : "",
    checkOut: hasDates && checkOutDate ? toDateString(checkOutDate) : "",
    adults: Number.isFinite(adultsRaw) ? Math.min(Math.max(adultsRaw, 1), 20) : 1,
    rooms: Number.isFinite(roomsRaw) ? Math.min(Math.max(roomsRaw, 1), 20) : 1,
    hasDates,
  };
}

export function getNights(checkIn: string, checkOut: string) {
  const checkInDate = parseDate(checkIn);
  const checkOutDate = parseDate(checkOut);

  if (!checkInDate || !checkOutDate || checkInDate.getTime() >= checkOutDate.getTime()) {
    return 0;
  }

  return Math.round((checkOutDate.getTime() - checkInDate.getTime()) / DAY_MS);
}

export function doesDateRangeOverlap(
  checkIn: string,
  checkOut: string,
  rangeStart: string,
  rangeEnd: string,
) {
  const requestStart = parseDate(checkIn);
  const requestEnd = parseDate(checkOut);
  const busyStart = parseDate(rangeStart);
  const busyEnd = parseDate(rangeEnd);

  if (!requestStart || !requestEnd || !busyStart || !busyEnd) {
    return false;
  }

  return requestStart.getTime() < busyEnd.getTime() && requestEnd.getTime() > busyStart.getTime();
}

export function isRoomAvailableForDates(room: Pick<PricingRoom, "busyRanges">, checkIn: string, checkOut: string) {
  return !(room.busyRanges ?? []).some((range) =>
    doesDateRangeOverlap(checkIn, checkOut, range.startsOn, range.endsOn),
  );
}

function getSeasonalPriceForDate(seasonalPrices: OwnerSeasonalPrice[] | undefined, date: string) {
  return (seasonalPrices ?? []).find(
    (price) => price.isActive && price.startsOn <= date && price.endsOn >= date,
  );
}

export function calculateRoomPricing(room: PricingRoom, checkIn: string, checkOut: string) {
  const nights = getNights(checkIn, checkOut);
  const nightlyPrices = Array.from({ length: nights }, (_, index) => {
    const date = toDateString(addDays(parseDate(checkIn) as Date, index));
    const seasonalPrice = getSeasonalPriceForDate(room.seasonalPrices, date);

    return {
      date,
      pricePerNight: Number(seasonalPrice?.pricePerNight ?? room.pricePerNight),
      source: seasonalPrice ? ("seasonal" as const) : ("base" as const),
      seasonalPriceId: seasonalPrice?.id,
    };
  });
  const totalPrice = nightlyPrices.reduce((sum, item) => sum + item.pricePerNight, 0);
  const displayPricePerNight = nights > 0 ? Math.round(totalPrice / nights) : room.pricePerNight;

  return {
    nights,
    displayPricePerNight,
    totalPrice,
    nightlyPrices,
  };
}

export function buildPublicRoomQuote(room: PublicRoom, filters: PublicStayFilters): PublicRoom {
  const capacityMismatch = room.capacity < filters.adults;
  const roomsMismatch = room.bedrooms < filters.rooms;
  const datesMismatch = filters.hasDates && !isRoomAvailableForDates(room, filters.checkIn, filters.checkOut);
  const pricing = filters.hasDates
    ? calculateRoomPricing(room, filters.checkIn, filters.checkOut)
    : {
        nights: 0,
        displayPricePerNight: room.pricePerNight,
        totalPrice: undefined,
        nightlyPrices: [],
      };

  let unavailableReason = "";

  if (capacityMismatch) {
    unavailableReason = `Подходит до ${room.capacity} гостя(ей)`;
  } else if (roomsMismatch) {
    unavailableReason = `В номере ${room.bedrooms} спальня(и)`;
  } else if (datesMismatch) {
    unavailableReason = "На выбранные даты есть занятые даты";
  }

  return {
    ...room,
    isAvailableForFilter: !capacityMismatch && !roomsMismatch && !datesMismatch,
    unavailableReason,
    nights: pricing.nights,
    displayPricePerNight: pricing.displayPricePerNight,
    totalPrice: pricing.totalPrice,
    nightlyPrices: pricing.nightlyPrices,
  };
}
