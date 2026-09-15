import assert from "node:assert/strict";
import test from "node:test";

import {
  getOwnerPublicRequestContextFailure,
  isGuestRequestSubscriptionAllowed,
  getSnapshotBasePricePerNight,
  getSnapshotPricePerNight,
  getSnapshotTotalPrice,
} from "../../src/entities/request/api/request-rules.ts";
import { buildPublicRoomQuote } from "../../src/entities/room/model/pricing.ts";

const owner = { id: "owner-1", slug: "owner-page", isPublicHiddenByAdmin: false };
const property = {
  id: "property-1",
  ownerId: owner.id,
  slug: "sea-house",
  published: true,
  isFrozen: false,
};
const propertyRoom = {
  ownerId: owner.id,
  propertyId: property.id,
  kind: "property_room" as const,
  isActive: true,
  capacity: 4,
  bedrooms: 2,
};

test("request intake requires every public subscription context used by the source", () => {
  assert.equal(
    isGuestRequestSubscriptionAllowed({ source: "owner", ownerAllowed: true }),
    true,
  );
  assert.equal(
    isGuestRequestSubscriptionAllowed({ source: "owner", ownerAllowed: false }),
    false,
  );

  for (const source of ["agent", "collection"] as const) {
    assert.equal(
      isGuestRequestSubscriptionAllowed({ source, ownerAllowed: true, sourceContextAllowed: true }),
      true,
    );
    assert.equal(
      isGuestRequestSubscriptionAllowed({ source, ownerAllowed: true, sourceContextAllowed: false }),
      false,
    );
    assert.equal(
      isGuestRequestSubscriptionAllowed({ source, ownerAllowed: false, sourceContextAllowed: true }),
      false,
    );
  }
});

test("owner request context accepts only a visible room that belongs to the requested owner page", () => {
  const validContext = {
    publicSlug: owner.slug,
    propertySlug: property.slug,
    adultsCount: 3,
    roomsCount: 2,
    owner,
    property,
    room: propertyRoom,
  };

  assert.equal(getOwnerPublicRequestContextFailure(validContext), null);
  assert.equal(
    getOwnerPublicRequestContextFailure({ ...validContext, publicSlug: "another-owner" }),
    "property_not_found",
  );
  assert.equal(
    getOwnerPublicRequestContextFailure({
      ...validContext,
      room: { ...propertyRoom, ownerId: "owner-2" },
    }),
    "property_not_found",
  );
  assert.equal(
    getOwnerPublicRequestContextFailure({ ...validContext, property: { ...property, published: false } }),
    "property_not_found",
  );
  assert.equal(
    getOwnerPublicRequestContextFailure({ ...validContext, owner: { ...owner, isPublicHiddenByAdmin: true } }),
    "property_not_found",
  );
});

test("owner request context keeps standalone rooms separate and rechecks suitability", () => {
  const standaloneContext = {
    publicSlug: owner.slug,
    adultsCount: 2,
    roomsCount: 1,
    owner,
    property: null,
    room: {
      ...propertyRoom,
      propertyId: null,
      kind: "standalone_room" as const,
    },
  };

  assert.equal(getOwnerPublicRequestContextFailure(standaloneContext), null);
  assert.equal(
    getOwnerPublicRequestContextFailure({ ...standaloneContext, propertySlug: property.slug }),
    "property_not_found",
  );
  assert.equal(
    getOwnerPublicRequestContextFailure({ ...standaloneContext, adultsCount: 5 }),
    "room_not_suitable",
  );
  assert.equal(
    getOwnerPublicRequestContextFailure({ ...standaloneContext, roomsCount: 3 }),
    "room_not_suitable",
  );
});

test("public quote explains unavailable dates and calculates the current seasonal total", () => {
  const quotedRoom = buildPublicRoomQuote(
    {
      id: "room-1",
      title: "Семейный номер",
      subtitle: "",
      capacity: 4,
      bedrooms: 2,
      area: 36,
      pricePerNight: 4_000,
      status: "active",
      photos: [],
      amenities: [],
      seasonalPrices: [
        {
          id: "season-1",
          roomId: "room-1",
          startsOn: "2026-07-01",
          endsOn: "2026-07-02",
          pricePerNight: 5_000,
          isActive: true,
        },
      ],
      busyRanges: [
        {
          id: "busy-1",
          roomId: "room-1",
          startsOn: "2026-07-04",
          endsOn: "2026-07-04",
          source: "manual",
          label: "",
          note: "",
        },
      ],
    },
    { checkIn: "2026-07-01", checkOut: "2026-07-03", adults: 2, rooms: 1, hasDates: true },
  );

  assert.equal(quotedRoom.isAvailableForFilter, true);
  assert.equal(quotedRoom.totalPrice, 10_000);
  assert.equal(quotedRoom.displayPricePerNight, 5_000);

  const unavailableRoom = buildPublicRoomQuote(
    quotedRoom,
    { checkIn: "2026-07-04", checkOut: "2026-07-05", adults: 2, rooms: 1, hasDates: true },
  );
  assert.equal(unavailableRoom.isAvailableForFilter, false);
  assert.equal(unavailableRoom.unavailableReason, "Занято на выбранные даты");
});

test("owner-facing request prices prefer the saved snapshot over current room values", () => {
  const request = {
    base_price_per_night: 4_000,
    total_price: 8_000,
    pricing_snapshot: {
      base_price_per_night: 4_500,
      display_price_per_night: 5_000,
      total_price: 15_000,
    },
  };

  assert.equal(getSnapshotBasePricePerNight(request), 4_500);
  assert.equal(getSnapshotPricePerNight(request), 5_000);
  assert.equal(getSnapshotTotalPrice(request), 15_000);
});
