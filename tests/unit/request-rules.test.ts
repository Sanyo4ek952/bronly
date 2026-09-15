import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAgentTransferRequest,
  canOwnerTransitionRequestStatus,
  normalizeStatus,
  type RequestStatus,
} from "../../src/entities/request/api/request-rules.ts";

const statuses: RequestStatus[] = ["new", "transferred_to_owner", "accepted_by_owner", "rejected", "completed"];

// Scenarios describe the observable workflow, including owner and agent collections.
for (const { label, source, agent_id, allowed } of [
  { label: "owner link", source: "owner", agent_id: null, allowed: [
    ["new", "accepted_by_owner"], ["new", "rejected"],
    ["transferred_to_owner", "rejected"],
    ["accepted_by_owner", "rejected"], ["accepted_by_owner", "completed"],
  ] },
  { label: "owner collection", source: "collection", agent_id: null, allowed: [
    ["new", "accepted_by_owner"], ["new", "rejected"],
    ["transferred_to_owner", "rejected"],
    ["accepted_by_owner", "rejected"], ["accepted_by_owner", "completed"],
  ] },
  { label: "own collection of an agent", source: "collection", agent_id: "owner-1", allowed: [
    ["new", "accepted_by_owner"], ["new", "rejected"],
    ["transferred_to_owner", "rejected"],
    ["accepted_by_owner", "rejected"], ["accepted_by_owner", "completed"],
  ] },
  { label: "agent link", source: "agent", agent_id: "agent-1", allowed: [
    ["transferred_to_owner", "accepted_by_owner"], ["transferred_to_owner", "rejected"],
    ["accepted_by_owner", "rejected"], ["accepted_by_owner", "completed"],
  ] },
  { label: "agent collection", source: "collection", agent_id: "agent-1", allowed: [
    ["transferred_to_owner", "accepted_by_owner"], ["transferred_to_owner", "rejected"],
    ["accepted_by_owner", "rejected"], ["accepted_by_owner", "completed"],
  ] },
] as const) {
  test(`owner transitions: ${label}, including all forbidden status pairs`, () => {
    for (const status of statuses) {
      for (const nextStatus of statuses) {
        const expected = allowed.some(([from, to]) => from === status && to === nextStatus);
        assert.equal(canOwnerTransitionRequestStatus({ owner_id: "owner-1", agent_id, source, status }, nextStatus),
          expected, `${label}: ${status} -> ${nextStatus}`);
      }
    }
  });
}

test("agent can transfer only a new agent or collection request", () => {
  for (const source of ["owner", "agent", "collection"] as const) {
    for (const status of statuses) {
      assert.equal(canAgentTransferRequest({ source, status }), source !== "owner" && status === "new", `${source}: ${status}`);
    }
  }
});

test("legacy statuses normalize to the canonical workflow", () => {
  assert.equal(normalizeStatus("owner_confirmed"), "accepted_by_owner");
  assert.equal(normalizeStatus("declined"), "rejected");
  assert.equal(normalizeStatus("in_progress"), "transferred_to_owner");
});
