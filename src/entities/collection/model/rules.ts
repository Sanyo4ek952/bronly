export type CollectionCreatorRole = "owner" | "agent";

type CollectionCreator = {
  creatorId: string;
  creatorRole: CollectionCreatorRole;
};

type CollectionRoomScope = {
  ownerId: string;
  propertyId: string | null;
  kind: string;
};

export function canCollectionCreatorAccessProperty(input: {
  creator: CollectionCreator;
  propertyOwnerId: string;
  hasActivePropertyLink: boolean;
}) {
  return input.creator.creatorId === input.propertyOwnerId
    || (input.creator.creatorRole === "agent" && input.hasActivePropertyLink);
}

export function canCollectionCreatorAccessRoom(input: {
  creator: CollectionCreator;
  room: CollectionRoomScope;
  hasActivePropertyLink: boolean;
  hasActiveRoomLink: boolean;
}) {
  if (input.creator.creatorId === input.room.ownerId) {
    return true;
  }

  if (input.creator.creatorRole !== "agent") {
    return false;
  }

  return input.room.kind === "standalone_room"
    ? input.hasActiveRoomLink
    : Boolean(input.room.propertyId) && input.hasActivePropertyLink;
}

export function isRoomIncludedInCollection(
  items: ReadonlyArray<{ propertyId: string | null; roomId: string | null }>,
  room: Pick<CollectionRoomScope, "propertyId"> & { id: string },
) {
  return items.some((item) => item.roomId === room.id || (Boolean(room.propertyId) && item.propertyId === room.propertyId));
}

export function getCollectionRequestContextFailure(input: {
  publicSlug?: string;
  agentProfileId?: string | null;
  collection: (CollectionCreator & {
    slug: string;
    isArchived: boolean;
    creatorHasRole: boolean;
    isCreatorHidden: boolean;
  }) | null;
  room: CollectionRoomScope;
  isRoomIncluded: boolean;
  hasActivePropertyLink: boolean;
  hasActiveRoomLink: boolean;
}) {
  const collection = input.collection;

  if (
    !collection
    || collection.isArchived
    || collection.slug !== input.publicSlug
    || !collection.creatorHasRole
    || collection.isCreatorHidden
    || !input.isRoomIncluded
  ) {
    return "property_not_found" as const;
  }

  if (collection.creatorRole === "owner") {
    return !input.agentProfileId && collection.creatorId === input.room.ownerId
      ? null
      : "property_not_found" as const;
  }

  if (input.agentProfileId !== collection.creatorId) {
    return "property_not_found" as const;
  }

  return canCollectionCreatorAccessRoom({
    creator: collection,
    room: input.room,
    hasActivePropertyLink: input.hasActivePropertyLink,
    hasActiveRoomLink: input.hasActiveRoomLink,
  })
    ? null
    : "property_not_found" as const;
}

export function isCollectionVisitorKey(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
