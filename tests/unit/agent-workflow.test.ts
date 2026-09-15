import assert from "node:assert/strict";
import test from "node:test";

import {
  isCanonicalAgentPublicId,
  normalizeAgentMarkupPercent,
} from "../../src/entities/collaboration/model/rules.ts";
import {
  canAgentRequestCompletion,
  canAgentTransferRequest,
  getAgentPublicRequestContextFailure,
  type RequestStatus,
} from "../../src/entities/request/api/request-rules.ts";

const statuses: RequestStatus[] = ["new", "transferred_to_owner", "accepted_by_owner", "rejected", "completed"];

test("canonical agent public ids are stable six-character identifiers", () => {
  assert.equal(isCanonicalAgentPublicId("ag_a1b2c3"), true);
  assert.equal(isCanonicalAgentPublicId("agent-page"), false);
  assert.equal(isCanonicalAgentPublicId("ag_A1B2C3"), false);
  assert.equal(isCanonicalAgentPublicId("ag_short"), false);
  assert.equal(isCanonicalAgentPublicId(null), false);
});

test("agent markup accepts zero through the database precision limit and rejects unsafe values", () => {
  assert.equal(normalizeAgentMarkupPercent(0), 0);
  assert.equal(normalizeAgentMarkupPercent(12.345), 12.35);
  assert.equal(normalizeAgentMarkupPercent(999.99), 999.99);
  assert.equal(normalizeAgentMarkupPercent(-0.01), null);
  assert.equal(normalizeAgentMarkupPercent(1_000), null);
  assert.equal(normalizeAgentMarkupPercent(Number.NaN), null);
});

const sharedPropertyContext = {
  requestedPublicId: "ag_a1b2c3",
  agent: {
    id: "agent-1",
    publicId: "ag_a1b2c3",
    hasAgentRole: true,
    isPublicHiddenByAdmin: false,
  },
  room: {
    ownerId: "owner-1",
    propertyId: "property-1",
    kind: "property_room",
  },
  hasActivePropertyLink: true,
  hasActiveRoomLink: false,
};

test("agent request context requires the canonical id, agent role and an active target link", () => {
  assert.equal(getAgentPublicRequestContextFailure(sharedPropertyContext), null);
  assert.equal(
    getAgentPublicRequestContextFailure({ ...sharedPropertyContext, requestedPublicId: "legacy-agent" }),
    "agent_not_found",
  );
  assert.equal(
    getAgentPublicRequestContextFailure({
      ...sharedPropertyContext,
      agent: { ...sharedPropertyContext.agent, hasAgentRole: false },
    }),
    "agent_not_found",
  );
  assert.equal(
    getAgentPublicRequestContextFailure({ ...sharedPropertyContext, hasActivePropertyLink: false }),
    "room_not_shared",
  );
  assert.equal(
    getAgentPublicRequestContextFailure({
      ...sharedPropertyContext,
      room: { ownerId: "agent-1", propertyId: "property-own", kind: "property_room" },
      hasActivePropertyLink: false,
    }),
    null,
  );
});

test("standalone rooms require their own active collaboration", () => {
  const standaloneContext = {
    ...sharedPropertyContext,
    room: { ownerId: "owner-1", propertyId: null, kind: "standalone_room" },
    hasActivePropertyLink: false,
    hasActiveRoomLink: true,
  };

  assert.equal(getAgentPublicRequestContextFailure(standaloneContext), null);
  assert.equal(
    getAgentPublicRequestContextFailure({ ...standaloneContext, hasActiveRoomLink: false }),
    "room_not_shared",
  );
});

test("agent transfer and completion requests follow the full status matrix", () => {
  for (const status of statuses) {
    assert.equal(
      canAgentTransferRequest({ source: "agent", status }),
      status === "new",
      `transfer from ${status}`,
    );
    assert.equal(
      canAgentRequestCompletion({ source: "agent", status, completion_requested_at: null }),
      status === "accepted_by_owner",
      `completion request from ${status}`,
    );
  }

  assert.equal(
    canAgentRequestCompletion({
      source: "agent",
      status: "accepted_by_owner",
      completion_requested_at: "2026-09-15T10:00:00.000Z",
    }),
    false,
  );
  assert.equal(
    canAgentRequestCompletion({ source: "owner", status: "accepted_by_owner", completion_requested_at: null }),
    false,
  );
});
