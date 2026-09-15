export type AccessRole = "owner" | "agent" | "admin";

type AccessProfile = {
  id: string;
  roles: readonly AccessRole[];
};

type PublicGuestRequestPayload = {
  source: "owner" | "agent" | "collection";
  publicSlug?: string;
  roomId: string;
  guestName: string;
  guestPhone: string;
  guestComment: string;
  adultsCount: number;
  roomsCount: number;
  agentProfileId?: string | null;
  collectionId?: string | null;
};

export function canAccessOwnerMutations(profile: AccessProfile | null | undefined) {
  return Boolean(profile?.roles.includes("owner"));
}

export function canManageOwnedResource(profile: AccessProfile | null | undefined, ownerId: string | null | undefined) {
  return canAccessOwnerMutations(profile) && Boolean(ownerId) && profile?.id === ownerId;
}

export function canAccessAgentMutations(profile: AccessProfile | null | undefined) {
  return Boolean(profile?.roles.includes("agent"));
}

export function canAgentManageRequest(profile: AccessProfile | null | undefined, agentId: string | null | undefined) {
  return canAccessAgentMutations(profile) && Boolean(agentId) && profile?.id === agentId;
}

export function isValidPublicGuestRequestPayload(input: PublicGuestRequestPayload) {
  if (!input.roomId || !input.guestName || !input.guestPhone) {
    return false;
  }

  if (input.guestName.length > 120 || input.guestPhone.length > 80 || input.guestComment.length > 2_000) {
    return false;
  }

  if (
    !Number.isInteger(input.adultsCount) ||
    input.adultsCount < 1 ||
    input.adultsCount > 20 ||
    !Number.isInteger(input.roomsCount) ||
    input.roomsCount < 1 ||
    input.roomsCount > 20
  ) {
    return false;
  }

  if (input.source === "owner") {
    return Boolean(input.publicSlug) && !input.agentProfileId && !input.collectionId;
  }

  if (input.source === "agent") {
    return Boolean(input.publicSlug) && Boolean(input.agentProfileId) && !input.collectionId;
  }

  return Boolean(input.publicSlug) && Boolean(input.collectionId);
}
