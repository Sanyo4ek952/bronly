export function buildPropertyPath(propertyId: string, section: "property" | "rooms" | "calendar" = "property") {
  if (section === "rooms") {
    return `/dashboard/properties/${propertyId}/rooms`;
  }

  if (section === "calendar") {
    return `/dashboard/properties/${propertyId}/calendar`;
  }

  return `/dashboard/properties/${propertyId}`;
}

export function buildPropertyRoomCreatePath(propertyId: string) {
  return `/dashboard/properties/${propertyId}/rooms/new`;
}

export function buildStandaloneRoomCreatePath() {
  return "/dashboard/rooms/new";
}

export function buildStandaloneRoomPath(roomId: string) {
  return `/dashboard/properties?roomId=${encodeURIComponent(roomId)}`;
}

export function buildStandaloneRoomSettingsPath(roomId: string) {
  return `/dashboard/rooms/${roomId}/settings`;
}

export function buildStandaloneRoomCalendarPath(roomId: string) {
  return `/dashboard/rooms/${roomId}/calendar`;
}

export function buildPropertyRoomPath(propertyId: string, roomId: string) {
  return `/dashboard/properties/${propertyId}/rooms/${roomId}`;
}

export function buildPropertyRoomSettingsPath(propertyId: string, roomId: string) {
  return `/dashboard/properties/${propertyId}/rooms/${roomId}/settings`;
}

export function buildPropertyPathWithState(
  propertyId: string,
  section: "property" | "rooms" | "calendar",
  state: Record<string, string>,
) {
  const params = new URLSearchParams(state);
  const query = params.toString();
  const basePath = buildPropertyPath(propertyId, section);
  return query ? `${basePath}?${query}` : basePath;
}
