export function encodePublicPathSegment(value: string) {
  return encodeURIComponent(value);
}

export function buildOwnerPublicPath(slug?: string | null) {
  return slug ? `/p/${encodePublicPathSegment(slug)}` : null;
}

export function buildAgentPublicPath(agentPublicId?: string | null) {
  return agentPublicId ? `/a/${encodePublicPathSegment(agentPublicId)}` : null;
}

export function buildCollectionPublicPath(slug?: string | null) {
  return slug ? `/c/${encodePublicPathSegment(slug)}` : null;
}

type StayLinkFilters = {
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
};

export function buildPublicStayHref(path: string, filters: StayLinkFilters, extra?: Record<string, string>) {
  const params = new URLSearchParams(extra);
  if (filters.checkIn) params.set("checkIn", filters.checkIn);
  if (filters.checkOut) params.set("checkOut", filters.checkOut);
  params.set("adults", String(filters.adults));
  params.set("rooms", String(filters.rooms));
  return `${path}?${params.toString()}`;
}

export function buildPublicDetailHref(base: string, kind: "properties" | "rooms", id: string, filters: StayLinkFilters) {
  return buildPublicStayHref(`${base}/${kind}/${encodePublicPathSegment(id)}`, filters);
}

export function buildPublicRequestHref(base: string, roomId: string, filters: StayLinkFilters, propertySlug?: string | null) {
  return buildPublicStayHref(`${base}/request`, filters, {
    roomId,
    ...(propertySlug ? { propertySlug } : {}),
  });
}
