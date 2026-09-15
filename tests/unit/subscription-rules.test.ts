import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSubscriptionSchedule,
  calculateSubscriptionRuntimeState,
  isRoomLimitReached,
} from "../../src/entities/subscription/model/subscription-rules.ts";
import { calculateManualExtensionPaidUntil } from "../../src/entities/subscription/model/manual-extension.ts";
import { mapActionError } from "../../src/features/property/owner-mutations/lib/errors.ts";
import type { SupabaseSubscriptionRow } from "../../src/shared/api/supabase/types";

const row: SupabaseSubscriptionRow = {
  id: "subscription-1", profile_id: "owner-1", role_context: "owner",
  status: "active", plan_name: "MVP", active_room_limit: 3,
  trial_ends_at: null, grace_ends_at: null, paid_until: "2026-06-01T00:00:00.000Z",
  created_at: "2026-05-01T00:00:00.000Z", updated_at: "2026-05-01T00:00:00.000Z",
};
function calculate(subscriptionRow: SupabaseSubscriptionRow | null, activeRoomCount = 2, now = "2026-06-01T00:00:00.000Z") {
  return calculateSubscriptionRuntimeState({
    profileId: "owner-1", roleContext: "owner", subscriptionRow, activeRoomCount, now: new Date(now),
  });
}

for (const [now, expectedStatus] of [
  ["2026-05-31T23:59:59.999Z", "active"],
  ["2026-06-01T00:00:00.000Z", "active"],
  ["2026-06-01T00:00:00.001Z", "grace"],
  ["2026-06-04T00:00:00.000Z", "grace"],
  ["2026-06-04T00:00:00.001Z", "expired"],
] as const) {
  test(`subscription at ${now}: ${expectedStatus}`, () => {
    const state = calculate(row, 2, now);
    assert.equal(state.status, expectedStatus);
    assert.equal(state.isPublicAllowed, expectedStatus !== "expired");
    assert.equal(state.isRequestIntakeAllowed, expectedStatus !== "expired");
    assert.equal(state.isMutationAllowed, expectedStatus !== "expired");
    assert.equal(state.isCabinetRestricted, expectedStatus === "expired");
    assert.equal(state.showGraceWarning, expectedStatus === "grace");
    assert.equal(state.publicWarningText !== null, expectedStatus === "grace");
    assert.equal(state.publicRestrictionMode, expectedStatus === "active" ? "none" : expectedStatus);
  });
}

test("explicit grace deadline overrides the default three days", () => {
  const custom = { ...row, grace_ends_at: "2026-06-02T00:00:00.000Z" };
  assert.equal(calculate(custom, 2, "2026-06-02T00:00:00.000Z").status, "grace");
  assert.equal(calculate(custom, 2, "2026-06-02T00:00:00.001Z").status, "expired");
});

test("stored grace without paid_until expires after its deadline", () => {
  const grace = { ...row, status: "grace" as const, paid_until: null, grace_ends_at: "2026-06-02T00:00:00.000Z" };
  assert.equal(calculate(grace, 2, "2026-06-02T00:00:00.000Z").status, "grace");
  assert.equal(calculate(grace, 2, "2026-06-02T00:00:00.001Z").status, "expired");
});

test("trial uses its own deadline, then grace, then expires", () => {
  const trial = {
    ...row,
    status: "trial" as const,
    paid_until: null,
    trial_ends_at: "2026-06-01T00:00:00.000Z",
    grace_ends_at: "2026-06-04T00:00:00.000Z",
  };

  assert.equal(calculate(trial, 2, "2026-06-01T00:00:00.000Z").status, "trial");
  assert.equal(calculate(trial, 2, "2026-06-01T00:00:00.001Z").status, "grace");
  assert.equal(calculate(trial, 2, "2026-06-04T00:00:00.001Z").status, "expired");
});

test("trial without a valid deadline and missing subscription rows fail closed", () => {
  assert.equal(calculate({ ...row, status: "trial", paid_until: null, trial_ends_at: null }).status, "expired");
  assert.equal(calculate(null).status, "expired");
});

test("legacy manual rows are presented as active and still follow paid and grace dates", () => {
  const legacyManual = { ...row, status: "manual" as const };
  assert.equal(calculate(legacyManual, 2, "2026-06-01T00:00:00.000Z").status, "active");
  assert.equal(calculate(legacyManual, 2, "2026-06-01T00:00:00.001Z").status, "grace");
});

for (const [count, limit, remaining, reached] of [
  [0, 3, 3, false], [2, 3, 1, false], [3, 3, 0, true], [4, 3, 0, true], [0, 0, 0, true],
] as const) {
  test(`custom room limit ${limit} at ${count} active rooms`, () => {
    const state = calculate({ ...row, active_room_limit: limit }, count);
    assert.equal(state.roomLimit, limit);
    assert.equal(state.remainingRoomSlots, remaining);
    assert.equal(state.isRoomLimitReached, reached);
    assert.equal(state.canAddActiveRoom, !reached);
    assert.equal(state.planTier, "custom");
  });
}

for (const [count, tier, limit] of [
  [0, "start", 3], [3, "start", 3], [4, "base", 10], [10, "base", 10], [11, "plus", null],
] as const) {
  test(`derived subscription plan at ${count} active rooms`, () => {
    const state = calculate(null, count);
    assert.equal(state.planTier, tier);
    assert.equal(state.roomLimit, limit);
    assert.equal(state.status, "expired");
    if (limit === null) {
      assert.equal(state.remainingRoomSlots, null);
      assert.equal(state.canAddActiveRoom, true);
    }
  });
}

test("unlimited room capacity is never exhausted", () => {
  assert.equal(isRoomLimitReached(1000, null), false);
});

test("database room-limit guard maps back to the same form feedback", () => {
  assert.equal(mapActionError({ code: "P0001", message: "active_room_limit_reached" }), "room-limit");
  assert.equal(mapActionError({ code: "P0001", message: "another server error" }), "save");
});

test("manual extension adds days after the later of now and the current paid deadline", () => {
  assert.equal(
    calculateManualExtensionPaidUntil({
      currentPaidUntil: "2026-06-10T12:00:00.000Z",
      now: new Date("2026-06-01T12:00:00.000Z"),
      extensionDays: 30,
    }),
    "2026-07-10T12:00:00.000Z",
  );
  assert.equal(
    calculateManualExtensionPaidUntil({
      currentPaidUntil: "2026-05-01T12:00:00.000Z",
      now: new Date("2026-06-01T12:00:00.000Z"),
      extensionDays: 30,
    }),
    "2026-07-01T12:00:00.000Z",
  );
});

test("manual extension validates the day range", () => {
  assert.throws(
    () => calculateManualExtensionPaidUntil({ currentPaidUntil: null, now: new Date(), extensionDays: 0 }),
    RangeError,
  );
});

test("admin schedule normalization keeps every selected status coherent with its dates", () => {
  const now = new Date("2026-06-01T12:00:00.000Z");
  const shared = {
    now,
    trialEndsAt: "2026-05-01T12:00:00.000Z",
    graceEndsAt: "2026-05-04T12:00:00.000Z",
    paidUntil: "2026-05-01T12:00:00.000Z",
  };

  const schedules = ["trial", "active", "grace", "expired"].map((status) => ({
    status,
    schedule: buildSubscriptionSchedule({ ...shared, status: status as "trial" | "active" | "grace" | "expired" }),
  }));

  for (const { status, schedule } of schedules) {
    const state = calculate({
      ...row,
      status: status as "trial" | "active" | "grace" | "expired",
      trial_ends_at: schedule.trialEndsAt,
      grace_ends_at: schedule.graceEndsAt,
      paid_until: schedule.paidUntil,
    }, 2, now.toISOString());
    assert.equal(state.status, status);
  }
});

test("owner and agent contexts apply identical supplied room limits", () => {
  for (const roleContext of ["owner", "agent"] as const) {
    const state = calculateSubscriptionRuntimeState({
      profileId: "profile-1", roleContext, subscriptionRow: { ...row, role_context: roleContext },
      activeRoomCount: 3, now: new Date("2026-06-01T00:00:00.000Z"), storedStatus: "grace",
    });
    assert.equal(state.isRoomLimitReached, true);
    assert.equal(state.roleContext, roleContext);
    assert.equal(state.status, "active");
    assert.equal(state.storedStatus, "grace");
  }
});
