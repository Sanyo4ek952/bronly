import assert from "node:assert/strict";
import test from "node:test";

import {
  getMilestoneInviteeRole,
  getReferralReviewResult,
  isReferralInviteAvailable,
} from "../../src/entities/referral/model/rules.ts";

test("an active unused invite stays available until its optional expiry", () => {
  const now = new Date("2026-09-15T12:00:00.000Z");

  assert.equal(isReferralInviteAvailable({ status: "active", usedByProfileId: null, expiresAt: null, now }), true);
  assert.equal(isReferralInviteAvailable({ status: "active", usedByProfileId: null, expiresAt: "2026-09-15T12:00:01.000Z", now }), true);
  assert.equal(isReferralInviteAvailable({ status: "active", usedByProfileId: null, expiresAt: "2026-09-15T12:00:00.000Z", now }), false);
  assert.equal(isReferralInviteAvailable({ status: "active", usedByProfileId: "profile-2", expiresAt: null, now }), false);
  assert.equal(isReferralInviteAvailable({ status: "used", usedByProfileId: "profile-2", expiresAt: null, now }), false);
  assert.equal(isReferralInviteAvailable({ status: "revoked", usedByProfileId: null, expiresAt: null, now }), false);
  assert.equal(isReferralInviteAvailable({ status: "expired", usedByProfileId: null, expiresAt: null, now }), false);
  assert.equal(isReferralInviteAvailable({ status: "active", usedByProfileId: null, expiresAt: "invalid", now }), false);
});

test("each milestone is tied to the expected invite role", () => {
  assert.equal(getMilestoneInviteeRole("owner_inventory_created"), "owner");
  assert.equal(getMilestoneInviteeRole("agent_first_active_collaboration"), "agent");
});

test("the first referral decision applies and repeated decisions are explicit no-ops", () => {
  assert.equal(getReferralReviewResult("pending", "approved"), "approved");
  assert.equal(getReferralReviewResult("pending", "rejected"), "rejected");
  assert.equal(getReferralReviewResult("approved", "approved"), "already_approved");
  assert.equal(getReferralReviewResult("rejected", "rejected"), "already_rejected");
  assert.equal(getReferralReviewResult("approved", "rejected"), "conflict_approved");
  assert.equal(getReferralReviewResult("rejected", "approved"), "conflict_rejected");
});
