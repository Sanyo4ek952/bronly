import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canCollectionCreatorAccessProperty,
  canCollectionCreatorAccessRoom,
  getCollectionRequestContextFailure,
  isCollectionVisitorKey,
  isRoomIncludedInCollection,
} from "../../src/entities/collection/model/rules.ts";
import { buildPublicRoomQuote } from "../../src/entities/room/model/pricing.ts";

const ownerCollection = {
  creatorId: "owner-1",
  creatorRole: "owner" as const,
  slug: "family-trip",
  isArchived: false,
  creatorHasRole: true,
  isCreatorHidden: false,
};
const propertyRoom = {
  ownerId: "owner-1",
  propertyId: "property-1",
  kind: "property_room",
};

test("a collection property includes its rooms while a direct item includes only its room", () => {
  const items = [
    { propertyId: "property-1", roomId: null },
    { propertyId: null, roomId: "standalone-1" },
  ];

  assert.equal(isRoomIncludedInCollection(items, { id: "room-1", propertyId: "property-1" }), true);
  assert.equal(isRoomIncludedInCollection(items, { id: "room-2", propertyId: "property-2" }), false);
  assert.equal(isRoomIncludedInCollection(items, { id: "standalone-1", propertyId: null }), true);
  assert.equal(isRoomIncludedInCollection(items, { id: "standalone-2", propertyId: null }), false);
});

test("owner collection request requires its public slug, active state, role and owned included room", () => {
  const valid = {
    publicSlug: ownerCollection.slug,
    collection: ownerCollection,
    room: propertyRoom,
    isRoomIncluded: true,
    hasActivePropertyLink: false,
    hasActiveRoomLink: false,
  };

  assert.equal(getCollectionRequestContextFailure(valid), null);
  assert.equal(getCollectionRequestContextFailure({ ...valid, publicSlug: "another" }), "property_not_found");
  assert.equal(getCollectionRequestContextFailure({ ...valid, collection: { ...ownerCollection, isArchived: true } }), "property_not_found");
  assert.equal(getCollectionRequestContextFailure({ ...valid, collection: { ...ownerCollection, creatorHasRole: false } }), "property_not_found");
  assert.equal(getCollectionRequestContextFailure({ ...valid, collection: { ...ownerCollection, isCreatorHidden: true } }), "property_not_found");
  assert.equal(getCollectionRequestContextFailure({ ...valid, isRoomIncluded: false }), "property_not_found");
  assert.equal(getCollectionRequestContextFailure({ ...valid, room: { ...propertyRoom, ownerId: "owner-2" } }), "property_not_found");
  assert.equal(getCollectionRequestContextFailure({ ...valid, agentProfileId: "agent-1" }), "property_not_found");
});

test("agent collection keeps only own or actively linked inventory", () => {
  const creator = { creatorId: "agent-1", creatorRole: "agent" as const };

  assert.equal(canCollectionCreatorAccessProperty({ creator, propertyOwnerId: "agent-1", hasActivePropertyLink: false }), true);
  assert.equal(canCollectionCreatorAccessProperty({ creator, propertyOwnerId: "owner-1", hasActivePropertyLink: true }), true);
  assert.equal(canCollectionCreatorAccessProperty({ creator, propertyOwnerId: "owner-1", hasActivePropertyLink: false }), false);
  assert.equal(canCollectionCreatorAccessRoom({ creator, room: propertyRoom, hasActivePropertyLink: true, hasActiveRoomLink: false }), true);
  assert.equal(canCollectionCreatorAccessRoom({ creator, room: propertyRoom, hasActivePropertyLink: false, hasActiveRoomLink: false }), false);
  assert.equal(
    canCollectionCreatorAccessRoom({
      creator,
      room: { ownerId: "owner-1", propertyId: null, kind: "standalone_room" },
      hasActivePropertyLink: false,
      hasActiveRoomLink: true,
    }),
    true,
  );
});

test("agent collection request requires the matching agent and current collaboration", () => {
  const agentCollection = { ...ownerCollection, creatorId: "agent-1", creatorRole: "agent" as const };
  const valid = {
    publicSlug: agentCollection.slug,
    agentProfileId: "agent-1",
    collection: agentCollection,
    room: propertyRoom,
    isRoomIncluded: true,
    hasActivePropertyLink: true,
    hasActiveRoomLink: false,
  };

  assert.equal(getCollectionRequestContextFailure(valid), null);
  assert.equal(getCollectionRequestContextFailure({ ...valid, agentProfileId: "agent-2" }), "property_not_found");
  assert.equal(getCollectionRequestContextFailure({ ...valid, hasActivePropertyLink: false }), "property_not_found");
});

test("agent collection quote shows current markup and seasonal price", () => {
  const quote = buildPublicRoomQuote(
    {
      id: "room-1",
      title: "Номер",
      subtitle: "",
      capacity: 4,
      bedrooms: 2,
      area: 30,
      pricePerNight: 4_000,
      status: "active",
      photos: [],
      amenities: [],
      seasonalPrices: [{ id: "season-1", roomId: "room-1", startsOn: "2026-07-01", endsOn: "2026-07-01", pricePerNight: 5_000, isActive: true }],
      busyRanges: [],
      agentMarkupPercent: 20,
    },
    { checkIn: "2026-07-01", checkOut: "2026-07-03", adults: 2, rooms: 1, hasDates: true },
  );

  assert.equal(quote.displayPricePerNight, 5_400);
  assert.equal(quote.totalPrice, 10_800);
  assert.equal(quote.agentMarkupPercent, 20);
});

test("collection open tracking accepts a session UUID and SQL deduplicates it atomically", () => {
  assert.equal(isCollectionVisitorKey("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isCollectionVisitorKey("same-browser"), false);

  const sql = readFileSync("supabase/migrations/202609150003_collections_hardening.sql", "utf8");
  assert.match(sql, /unique \(collection_id, event_type, visitor_key\)/);
  assert.match(sql, /on conflict do nothing/);
  assert.match(sql, /views_count = views_count \+ 1/);
  assert.match(sql, /target_collection\.is_archived/);
  assert.match(sql, /agent_property_links[\s\S]*status = 'active'/);
  assert.match(sql, /agent_room_links[\s\S]*status = 'active'/);
});
