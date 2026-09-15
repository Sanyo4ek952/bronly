import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canAccessAgentMutations,
  canAccessOwnerMutations,
  canAgentManageRequest,
  canManageOwnedResource,
  isValidPublicGuestRequestPayload,
} from "../../src/shared/api/supabase/access-rules.ts";

const owner = { id: "owner-1", roles: ["owner"] as const };
const agent = { id: "agent-1", roles: ["agent"] as const };

test("owner access requires the owner role and matching resource owner", () => {
  assert.equal(canAccessOwnerMutations({ ...owner, roles: [...owner.roles] }), true);
  assert.equal(canAccessOwnerMutations({ ...agent, roles: [...agent.roles] }), false);
  assert.equal(canManageOwnedResource({ ...owner, roles: [...owner.roles] }, "owner-1"), true);
  assert.equal(canManageOwnedResource({ ...owner, roles: [...owner.roles] }, "owner-2"), false);
  assert.equal(canManageOwnedResource({ ...agent, roles: [...agent.roles] }, "owner-1"), false);
});

test("agent request access requires the agent role and matching agent", () => {
  assert.equal(canAccessAgentMutations({ ...agent, roles: [...agent.roles] }), true);
  assert.equal(canAgentManageRequest({ ...agent, roles: [...agent.roles] }, "agent-1"), true);
  assert.equal(canAgentManageRequest({ ...agent, roles: [...agent.roles] }, "agent-2"), false);
  assert.equal(canAgentManageRequest({ ...owner, roles: [...owner.roles] }, "owner-1"), false);
});

const validPayload = {
  source: "owner" as const,
  publicSlug: "owner-page",
  roomId: "room-1",
  guestName: "Иван",
  guestPhone: "+79990000000",
  guestComment: "",
  adultsCount: 2,
  roomsCount: 1,
};

test("public request validation rejects missing or oversized guest data", () => {
  assert.equal(isValidPublicGuestRequestPayload(validPayload), true);
  assert.equal(isValidPublicGuestRequestPayload({ ...validPayload, guestName: "" }), false);
  assert.equal(isValidPublicGuestRequestPayload({ ...validPayload, guestPhone: "" }), false);
  assert.equal(isValidPublicGuestRequestPayload({ ...validPayload, guestComment: "x".repeat(2_001) }), false);
  assert.equal(isValidPublicGuestRequestPayload({ ...validPayload, adultsCount: 0 }), false);
  assert.equal(isValidPublicGuestRequestPayload({ ...validPayload, roomsCount: 21 }), false);
});

test("public request validation enforces source context", () => {
  assert.equal(
    isValidPublicGuestRequestPayload({
      ...validPayload,
      source: "agent",
      agentProfileId: "agent-1",
    }),
    true,
  );
  assert.equal(isValidPublicGuestRequestPayload({ ...validPayload, source: "agent" }), false);
  assert.equal(
    isValidPublicGuestRequestPayload({
      ...validPayload,
      source: "collection",
      collectionId: "collection-1",
    }),
    true,
  );
  assert.equal(isValidPublicGuestRequestPayload({ ...validPayload, source: "collection" }), false);
});

test("RLS hardening covers owner scope and standalone room children", () => {
  const sql = readFileSync("supabase/migrations/202609140002_harden_data_access.sql", "utf8");

  assert.match(sql, /rooms_owner_manage[\s\S]*room_kind = 'property_room'[\s\S]*p\.owner_id = public\.current_profile_id\(\)/);
  assert.match(sql, /rooms_owner_manage[\s\S]*room_kind = 'standalone_room'[\s\S]*owner_id = public\.current_profile_id\(\)/);

  for (const policy of [
    "room_amenities_owner_manage",
    "room_seasonal_prices_owner_manage",
    "room_busy_ranges_owner_manage",
  ]) {
    assert.match(sql, new RegExp(`${policy}[\\s\\S]*r\\.owner_id = public\\.current_profile_id\\(\\)`));
  }

  assert.match(sql, /room_busy_ranges_agent_read[\s\S]*agent_room_links/);
  assert.match(sql, /guest_requests_owner_update[\s\S]*owner_id = public\.current_profile_id\(\)/);
  assert.match(sql, /guest_requests_agent_update[\s\S]*agent_id = public\.current_profile_id\(\)/);
});
