import assert from "node:assert/strict";
import test from "node:test";

import {
  doInclusiveDateRangesOverlap,
  isDateWithinInclusiveRange,
  isValidInclusiveDateRange,
} from "../../src/entities/room/model/date-ranges.ts";
import {
  calculateRoomPricing,
  doesDateRangeOverlap,
  isRoomAvailableForDates,
} from "../../src/entities/room/model/pricing.ts";

const busyDay = { id: "busy-1", roomId: "room-1", startsOn: "2026-06-10", endsOn: "2026-06-10", source: "manual", label: "", note: "" };

test("inclusive calendar ranges allow and contain a single day", () => {
  assert.equal(isValidInclusiveDateRange("2026-06-10", "2026-06-10"), true);
  assert.equal(isDateWithinInclusiveRange("2026-06-10", "2026-06-10", "2026-06-10"), true);
  assert.equal(doInclusiveDateRangesOverlap("2026-06-10", "2026-06-10", "2026-06-10", "2026-06-10"), true);
});

test("a single busy day blocks that night but permits checkout and next-day arrival", () => {
  assert.equal(doesDateRangeOverlap("2026-06-10", "2026-06-11", busyDay.startsOn, busyDay.endsOn), true);
  assert.equal(doesDateRangeOverlap("2026-06-09", "2026-06-10", busyDay.startsOn, busyDay.endsOn), false);
  assert.equal(doesDateRangeOverlap("2026-06-11", "2026-06-12", busyDay.startsOn, busyDay.endsOn), false);
  assert.equal(isRoomAvailableForDates({ busyRanges: [busyDay] }, "2026-06-10", "2026-06-11"), false);
});

test("season boundaries include both stored dates and exclude checkout", () => {
  const quote = calculateRoomPricing({
    id: "room-1",
    pricePerNight: 1000,
    capacity: 2,
    bedrooms: 1,
    seasonalPrices: [{
      id: "season-1", roomId: "room-1", startsOn: "2026-06-10", endsOn: "2026-06-11",
      pricePerNight: 1500, isActive: true,
    }],
  }, "2026-06-09", "2026-06-13");

  assert.deepEqual(quote.nightlyPrices.map(({ date, pricePerNight }) => [date, pricePerNight]), [
    ["2026-06-09", 1000], ["2026-06-10", 1500], ["2026-06-11", 1500], ["2026-06-12", 1000],
  ]);
  assert.equal(quote.totalPrice, 5000);
});

test("agent totals equal the sum of rounded snapshot nights", () => {
  const quote = calculateRoomPricing({
    id: "room-1", pricePerNight: 0.05, capacity: 2, bedrooms: 1, agentMarkupPercent: 10,
  }, "2026-06-10", "2026-06-12");

  assert.deepEqual(quote.nightlyPrices.map(({ pricePerNight }) => pricePerNight), [0.06, 0.06]);
  assert.equal(quote.totalPrice, 0.12);
  assert.equal(quote.totalPrice, quote.nightlyPrices.reduce((sum, night) => sum + night.pricePerNight, 0));
});
