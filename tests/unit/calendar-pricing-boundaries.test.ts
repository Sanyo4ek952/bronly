import assert from "node:assert/strict";
import test from "node:test";

import {
  doInclusiveDateRangesOverlap,
  doStayDateRangesOverlap,
  isDateWithinInclusiveRange,
  isDateWithinStayRange,
  isValidInclusiveDateRange,
  isValidStayDateRange,
} from "../../src/entities/room/model/date-ranges.ts";
import {
  addDaysToDateKey,
  findBusyRangeForDate,
  getTimelineBusyRanges,
  getTimelineDays,
} from "../../src/entities/room/model/calendar-helpers.ts";
import {
  calculateRoomPricing,
  doesDateRangeOverlap,
  isRoomAvailableForDates,
} from "../../src/entities/room/model/pricing.ts";

const busyNight = { id: "busy-1", roomId: "room-1", startsOn: "2026-06-10", endsOn: "2026-06-11", source: "manual", label: "", note: "" };

test("seasonal price ranges remain inclusive", () => {
  assert.equal(isValidInclusiveDateRange("2026-06-10", "2026-06-10"), true);
  assert.equal(isDateWithinInclusiveRange("2026-06-10", "2026-06-10", "2026-06-10"), true);
  assert.equal(doInclusiveDateRangesOverlap("2026-06-10", "2026-06-10", "2026-06-10", "2026-06-10"), true);
});

test("stay ranges are valid only when checkout is after check-in", () => {
  assert.equal(isValidStayDateRange("2026-06-10", "2026-06-11"), true);
  assert.equal(isValidStayDateRange("2026-06-10", "2026-06-10"), false);
  assert.equal(isValidStayDateRange("2026-06-11", "2026-06-10"), false);
  assert.equal(isValidStayDateRange("invalid", "2026-06-11"), false);
});

test("half-open stay ranges contain check-in but not checkout", () => {
  assert.equal(isDateWithinStayRange("2026-06-10", "2026-06-10", "2026-06-11"), true);
  assert.equal(isDateWithinStayRange("2026-06-11", "2026-06-10", "2026-06-11"), false);
});

test("adjacent stays do not overlap while shared nights do", () => {
  assert.equal(doStayDateRangesOverlap("2026-09-18", "2026-09-21", "2026-09-21", "2026-09-27"), false);
  assert.equal(doStayDateRangesOverlap("2026-09-20", "2026-09-22", "2026-09-21", "2026-09-27"), true);
});

test("a single busy night blocks that night but permits boundary checkout and arrival", () => {
  assert.equal(doesDateRangeOverlap("2026-06-10", "2026-06-11", busyNight.startsOn, busyNight.endsOn), true);
  assert.equal(doesDateRangeOverlap("2026-06-09", "2026-06-10", busyNight.startsOn, busyNight.endsOn), false);
  assert.equal(doesDateRangeOverlap("2026-06-11", "2026-06-12", busyNight.startsOn, busyNight.endsOn), false);
  assert.equal(isRoomAvailableForDates({ busyRanges: [busyNight] }, "2026-06-10", "2026-06-11"), false);
});

test("calendar cells and timeline bars exclude checkout", () => {
  const range = { ...busyNight, startsOn: "2026-09-21", endsOn: "2026-09-27" };
  const days = getTimelineDays(new Date(2026, 8, 1));
  const [timelineRange] = getTimelineBusyRanges([range], days);

  assert.equal(findBusyRangeForDate([range], "2026-09-26")?.id, range.id);
  assert.equal(findBusyRangeForDate([range], "2026-09-27"), null);
  assert.equal(timelineRange.startIndex, 20);
  assert.equal(timelineRange.endIndex, 25);
  assert.equal(timelineRange.span, 6);
});

test("half-open timeline clipping works across month and year boundaries", () => {
  const range = { ...busyNight, startsOn: "2026-12-31", endsOn: "2027-01-02" };
  const decemberRange = getTimelineBusyRanges([range], getTimelineDays(new Date(2026, 11, 1)))[0];
  const januaryRange = getTimelineBusyRanges([range], getTimelineDays(new Date(2027, 0, 1)))[0];

  assert.equal(addDaysToDateKey("2026-12-31", 1), "2027-01-01");
  assert.deepEqual({ start: decemberRange.startIndex, end: decemberRange.endIndex, span: decemberRange.span }, { start: 30, end: 30, span: 1 });
  assert.deepEqual({ start: januaryRange.startIndex, end: januaryRange.endIndex, span: januaryRange.span }, { start: 0, end: 0, span: 1 });
  assert.equal(findBusyRangeForDate([range], "2027-01-02"), null);
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
