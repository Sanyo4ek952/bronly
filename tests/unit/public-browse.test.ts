import assert from "node:assert/strict";
import test from "node:test";
import { findPublicDetail, sortPublicProperties, summarizePublicProperty } from "../../src/entities/property/model/public-browse.ts";
import { buildPublicDetailHref, buildPublicRequestHref, buildPublicStayHref } from "../../src/shared/lib/public-links.ts";
import { buildPublicRoomQuote, normalizePublicStayFilters } from "../../src/entities/room/model/pricing.ts";
import type { PublicRoom } from "../../src/entities/room/model/types.ts";
import type { PublicPropertySummary } from "../../src/entities/property/model/types.ts";

const filters = normalizePublicStayFilters({});
const room = (id: string, overrides: Partial<PublicRoom> = {}): PublicRoom => ({ id, title: id, subtitle: "", capacity: 3, bedrooms: 1, area: 20, pricePerNight: 2000, status: "active", photos: [], amenities: [], isAvailableForFilter: true, ...overrides });
const property = (id: string): PublicPropertySummary => ({ id, title: id, shortTitle: id, slug: id, propertyType: "Дом", detailMode: "compact", city: "", address: "", timezone: "Europe/Moscow", shortDescription: "", fullDescription: "", phone: "", telegram: "", checkInTime: "", checkOutTime: "", photos: [], features: [], aggregatedAmenities: [], houseRules: [] });

test("property counts published scoped rooms, excludes archive and uses quoted agent prices", () => {
  const rooms = [buildPublicRoomQuote(room("one", { agentMarkupPercent: 20 }), filters), room("archived", { status: "inactive", pricePerNight: 1 }), room("two", { pricePerNight: 3000, isAvailableForFilter: false })];
  assert.deepEqual(summarizePublicProperty(rooms, filters), { roomCount: 2, suitableCount: 1, minPrice: 2400 });
  assert.deepEqual(summarizePublicProperty([], filters), { roomCount: 0, suitableCount: 0, minPrice: null });
});

test("dated property quote uses only matching totals, including seasons and markup", () => {
  const dated = normalizePublicStayFilters({ checkIn: "2026-10-01", checkOut: "2026-10-03" });
  const quoted = buildPublicRoomQuote(room("one", { agentMarkupPercent: 10, seasonalPrices: [{ id: "season", roomId: "one", startsOn: "2026-10-02", endsOn: "2026-10-02", pricePerNight: 3000, isActive: true }] }), dated);
  assert.equal(summarizePublicProperty([room("busy", { totalPrice: 100, isAvailableForFilter: false }), quoted], dated).minPrice, 5500);
  assert.equal(summarizePublicProperty([room("busy", { totalPrice: 100, isAvailableForFilter: false })], dated).minPrice, null);
});

test("unsuitable properties stay visible below suitable ones without mutating input", () => {
  const sections = [{ property: property("busy"), rooms: [room("busy", { isAvailableForFilter: false })] }, { property: property("empty"), rooms: [] }, { property: property("match"), rooms: [room("match")] }];
  assert.deepEqual(sortPublicProperties(sections).map((s) => s.property.id), ["match", "busy", "empty"]);
  assert.equal(sections[0].property.id, "busy");
});

test("detail selection cannot escape a partial collection, storefront, or archive", () => {
  const sections = [{ property: property("house"), rooms: [room("selected"), room("archived", { status: "inactive" })], sourceKinds: ["room" as const] }];
  assert.equal(findPublicDetail(sections, [], "rooms", "selected")?.section?.property.id, "house");
  assert.equal(findPublicDetail(sections, [], "rooms", "neighbor"), null);
  assert.equal(findPublicDetail(sections, [], "rooms", "archived"), null);
  assert.equal(findPublicDetail(sections, [], "properties", "foreign"), null);
  assert.equal(findPublicDetail([], [], "rooms", "selected"), null);
  assert.equal(findPublicDetail([], [room("standalone")], "rooms", "standalone")?.section, null);
  assert.equal(findPublicDetail([{ property: property("empty"), rooms: [] }], [], "properties", "empty")?.section?.property.id, "empty");
});

test("owner, agent and collection links preserve filters and request identity", () => {
  const dated = normalizePublicStayFilters({ checkIn: "2026-10-01", checkOut: "2026-10-03", adults: 2, rooms: 1 });
  for (const base of ["/p/Birusova", "/a/ag_sample", "/c/guest"]) {
    const detail = new URL(buildPublicDetailHref(base, "rooms", "room/one", dated), "https://example.test");
    assert.equal(detail.pathname, `${base}/rooms/room%2Fone`);
    assert.equal(detail.searchParams.get("checkIn"), dated.checkIn);
    assert.equal(detail.searchParams.get("checkOut"), dated.checkOut);
    assert.equal(detail.searchParams.get("adults"), "2");
    const request = new URL(buildPublicRequestHref(base, "room-one", dated, "гостиница"), detail);
    assert.equal(request.pathname, `${base}/request`);
    assert.equal(request.searchParams.get("roomId"), "room-one");
    assert.equal(request.searchParams.get("propertySlug"), "гостиница");
    assert.equal(request.searchParams.get("checkOut"), dated.checkOut);
    assert.equal(new URL(buildPublicStayHref(base, dated), detail).searchParams.get("rooms"), "1");
  }
  assert.equal(new URL(buildPublicRequestHref("/p/a", "standalone", filters), "https://example.test").searchParams.has("propertySlug"), false);
});
