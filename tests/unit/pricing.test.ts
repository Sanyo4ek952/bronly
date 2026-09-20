import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateRoomPricing,
  doesDateRangeOverlap,
  getNights,
  isRoomAvailableForDates,
  normalizePublicStayFilters,
} from "../../src/entities/room/model/pricing.ts";
import type { OwnerSeasonalPrice } from "../../src/entities/room/model/types";

const room = { id: "room-1", pricePerNight: 1000, capacity: 4, bedrooms: 2 };
const season: OwnerSeasonalPrice = {
  id: "season-1", roomId: room.id, startsOn: "2026-06-02", endsOn: "2026-06-03",
  pricePerNight: 1500, isActive: true,
};

for (const [checkIn, checkOut, expected] of [
  ["2026-06-01", "2026-06-02", 1],
  ["2026-12-31", "2027-01-02", 2],
  ["2024-02-28", "2024-03-01", 2],
  ["2026-03-28", "2026-03-30", 2],
  ["2026-10-24", "2026-10-26", 2],
  ["2026-06-01", "2026-06-01", 0],
  ["2026-06-02", "2026-06-01", 0],
  ["", "2026-06-01", 0],
  ["01/06/2026", "2026-06-02", 0],
  ["2026-02-30", "2026-03-04", 0],
] as const) {
  test(`nights: ${checkIn} -> ${checkOut} = ${expected}`, () => {
    assert.equal(getNights(checkIn, checkOut), expected);
  });
}

test("base price is charged per night and excludes checkout", () => {
  const quote = calculateRoomPricing(room, "2026-06-01", "2026-06-04");
  assert.equal(quote.nights, 3);
  assert.equal(quote.totalPrice, 3000);
  assert.equal(quote.displayPricePerNight, 1000);
  assert.deepEqual(quote.nightlyPrices.map(({ date }) => date), ["2026-06-01", "2026-06-02", "2026-06-03"]);
});

test("seasonal price covers its first and last nights, then falls back to base", () => {
  const quote = calculateRoomPricing({ ...room, seasonalPrices: [season] }, "2026-06-01", "2026-06-05");
  assert.equal(quote.totalPrice, 5000);
  assert.deepEqual(quote.nightlyPrices.map(({ pricePerNight }) => pricePerNight), [1000, 1500, 1500, 1000]);
  assert.deepEqual(quote.nightlyPrices.map(({ source }) => source), ["base", "seasonal", "seasonal", "base"]);
});

test("inactive seasons and a season starting at checkout do not change the quote", () => {
  const inactiveQuote = calculateRoomPricing({ ...room, seasonalPrices: [{ ...season, isActive: false }] }, "2026-06-01", "2026-06-05");
  assert.equal(inactiveQuote.totalPrice, 4000);
  const checkoutQuote = calculateRoomPricing({ ...room, seasonalPrices: [season] }, "2026-06-01", "2026-06-02");
  assert.equal(checkoutQuote.totalPrice, 1000);
});

test("agent markup applies to both base and seasonal nights", () => {
  const quote = calculateRoomPricing({ ...room, seasonalPrices: [season], agentMarkupPercent: 10 }, "2026-06-01", "2026-06-04");
  assert.deepEqual(quote.nightlyPrices.map(({ pricePerNight }) => pricePerNight), [1100, 1650, 1650]);
  assert.equal(quote.totalPrice, 4400);
});

test("agent nightly price rounds to kopecks", () => {
  const quote = calculateRoomPricing({ ...room, pricePerNight: 99.99, agentMarkupPercent: 12.5 }, "2026-06-01", "2026-06-03");
  assert.equal(quote.nightlyPrices[0].pricePerNight, 112.49);
  assert.equal(quote.totalPrice, 224.98);
});

test("zero markup preserves owner price; without dates there is no stay total", () => {
  assert.equal(calculateRoomPricing({ ...room, agentMarkupPercent: 0 }, "2026-06-01", "2026-06-02").totalPrice, 1000);
  const quote = calculateRoomPricing({ ...room, agentMarkupPercent: 10 }, "", "");
  assert.equal(quote.nights, 0);
  assert.equal(quote.totalPrice, 0);
  assert.equal(quote.displayPricePerNight, 1100);
  assert.deepEqual(quote.nightlyPrices, []);
});

for (const [start, end, expected] of [
  ["2026-06-01", "2026-06-03", false],
  ["2026-06-05", "2026-06-07", false],
  ["2026-06-02", "2026-06-04", true],
  ["2026-06-04", "2026-06-06", true],
  ["2026-06-03", "2026-06-05", true],
  ["2026-06-01", "2026-06-07", true],
  ["2026-06-04", "2026-06-04", false],
  ["2026-06-05", "2026-06-03", false],
  ["invalid", "2026-06-04", false],
] as const) {
  test(`stay overlap with half-open busy June 3–5: ${start} -> ${end} = ${expected}`, () => {
    assert.equal(doesDateRangeOverlap(start, end, "2026-06-03", "2026-06-05"), expected);
  });
}

test("availability uses half-open busy dates and permits shared checkout/check-in boundaries", () => {
  const busyRoom = { busyRanges: [
    { id: "b1", roomId: room.id, startsOn: "2026-06-01", endsOn: "2026-06-03", source: "manual", label: "", note: "" },
    { id: "b2", roomId: room.id, startsOn: "2026-06-05", endsOn: "2026-06-07", source: "manual", label: "", note: "" },
  ] };
  assert.equal(isRoomAvailableForDates(busyRoom, "2026-06-03", "2026-06-05"), true);
  assert.equal(isRoomAvailableForDates(busyRoom, "2026-06-04", "2026-06-05"), true);
  assert.equal(isRoomAvailableForDates(busyRoom, "2026-06-04", "2026-06-06"), false);
  assert.equal(isRoomAvailableForDates({}, "2026-06-04", "2026-06-06"), true);
});

test("stay query defaults and numeric limits", () => {
  assert.deepEqual(normalizePublicStayFilters({}), { checkIn: "", checkOut: "", adults: 1, rooms: 1, hasDates: false });
  assert.deepEqual(normalizePublicStayFilters({ checkIn: "2026-06-01", checkOut: "2026-06-03", adults: "4", rooms: "2" }),
    { checkIn: "2026-06-01", checkOut: "2026-06-03", adults: 4, rooms: 2, hasDates: true });
  assert.equal(normalizePublicStayFilters({ adults: -1, rooms: "50" }).adults, 1);
  assert.equal(normalizePublicStayFilters({ adults: -1, rooms: "50" }).rooms, 20);
  assert.equal(normalizePublicStayFilters({ adults: Number.NaN, rooms: Infinity }).adults, 1);
  assert.equal(normalizePublicStayFilters({ adults: Number.NaN, rooms: Infinity }).rooms, 1);
});

test("invalid, partial, same-day and reversed stays clear both dates", () => {
  for (const [checkIn, checkOut] of [
    ["2026-06-01", ""], ["", "2026-06-03"], ["bad", "2026-06-03"],
    ["2026-06-03", "2026-06-03"], ["2026-06-04", "2026-06-03"],
    ["2026-02-30", "2026-03-04"],
  ]) {
    const filters = normalizePublicStayFilters({ checkIn, checkOut });
    assert.equal(filters.hasDates, false, `${checkIn} -> ${checkOut}`);
    assert.equal(filters.checkIn, "");
    assert.equal(filters.checkOut, "");
  }
});
