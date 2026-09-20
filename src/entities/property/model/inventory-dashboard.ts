type InventoryRoomPrice = {
  isActive: boolean;
  pricePerNight: number | null | undefined;
};

type InventoryCompletionInput = {
  hasDescription: boolean;
  hasPhotos: boolean;
  hasAmenitiesAndServices: boolean;
  hasRooms: boolean;
  hasPrices: boolean;
};

export function clampInventoryPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildInventoryCompleteness(parts: boolean[]) {
  const completedCount = parts.filter(Boolean).length;
  return clampInventoryPercent((completedCount / Math.max(parts.length, 1)) * 100);
}

export function buildInventoryCompletion(input: InventoryCompletionInput) {
  const hasDescriptionAndPhotos = input.hasDescription && input.hasPhotos;
  const hasPricesAndRooms = input.hasRooms && input.hasPrices;

  return {
    completenessPercent: buildInventoryCompleteness([
      hasDescriptionAndPhotos,
      input.hasAmenitiesAndServices,
      hasPricesAndRooms,
    ]),
    completionBreakdown: {
      ...input,
      hasDescriptionAndPhotos,
      hasPricesAndRooms,
    },
  };
}

export function getMinimumActiveRoomPrice(rooms: InventoryRoomPrice[]) {
  const positivePrices = rooms
    .filter((room) => room.isActive)
    .map((room) => Number(room.pricePerNight ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  return positivePrices.length ? Math.min(...positivePrices) : null;
}

export function buildInventoryPublicLabel(slug: string | null, appUrl: string | undefined) {
  if (!slug) {
    return null;
  }

  const publicPath = `/p/${slug}`;

  if (!appUrl) {
    return publicPath;
  }

  try {
    const url = new URL(publicPath, `${appUrl.replace(/\/+$/, "")}/`);
    return `${url.host}${url.pathname}`;
  } catch {
    return publicPath;
  }
}
