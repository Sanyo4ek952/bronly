import assert from "node:assert/strict";
import test from "node:test";

import { resolveLegacyRoomsRedirect } from "../../src/app/dashboard/rooms/redirect-target.ts";

test("legacy rooms route opens standalone room creation for empty inventory", () => {
  assert.equal(resolveLegacyRoomsRedirect([]), "/dashboard/rooms/new");
});

test("legacy rooms route prioritizes the first standalone room", () => {
  assert.equal(
    resolveLegacyRoomsRedirect([
      { id: "property-first", kind: undefined },
      { id: "standalone-first", kind: "standalone_room" },
      { id: "standalone-second", kind: "standalone_room" },
    ]),
    "/dashboard/rooms/standalone-first",
  );
});

test("legacy rooms route opens the first property room list when there are no standalone rooms", () => {
  assert.equal(
    resolveLegacyRoomsRedirect([
      { id: "property-first", kind: undefined },
      { id: "property-second", kind: "property" },
    ]),
    "/dashboard/properties/property-first/rooms",
  );
});
