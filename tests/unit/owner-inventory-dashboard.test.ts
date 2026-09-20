import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInventoryCompletion,
  buildInventoryCompleteness,
  buildInventoryPublicLabel,
  getMinimumActiveRoomPrice,
} from "../../src/entities/property/model/inventory-dashboard.ts";

test("inventory completeness reflects three documented readiness groups", () => {
  assert.equal(buildInventoryCompleteness([true, true, true]), 100);
  assert.equal(buildInventoryCompleteness([true, false, true]), 67);
  assert.equal(buildInventoryCompleteness([false, false, false]), 0);
});

test("inventory completion preserves the precise missing readiness steps", () => {
  assert.deepEqual(
    buildInventoryCompletion({
      hasDescription: true,
      hasPhotos: false,
      hasAmenitiesAndServices: true,
      hasRooms: true,
      hasPrices: true,
    }),
    {
      completenessPercent: 67,
      completionBreakdown: {
        hasDescription: true,
        hasPhotos: false,
        hasAmenitiesAndServices: true,
        hasRooms: true,
        hasPrices: true,
        hasDescriptionAndPhotos: false,
        hasPricesAndRooms: true,
      },
    },
  );
});

test("minimum inventory price ignores rooms hidden from guests", () => {
  assert.equal(
    getMinimumActiveRoomPrice([
      { isActive: false, pricePerNight: 1_000 },
      { isActive: true, pricePerNight: 3_500 },
      { isActive: true, pricePerNight: 4_000 },
    ]),
    3_500,
  );
  assert.equal(getMinimumActiveRoomPrice([{ isActive: false, pricePerNight: 1_000 }]), null);
});

test("public inventory label uses the configured application origin", () => {
  assert.equal(buildInventoryPublicLabel("Birusova", "https://www.bronly.app"), "www.bronly.app/p/Birusova");
  assert.equal(buildInventoryPublicLabel("Birusova", "http://localhost:3000"), "localhost:3000/p/Birusova");
  assert.equal(buildInventoryPublicLabel(null, "https://bronly.app"), null);
});
