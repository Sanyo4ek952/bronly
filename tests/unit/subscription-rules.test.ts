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
  status: "active", room_limit_override: null,
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
    assert.equal(state.isCabinetAllowed, true);
    assert.equal(state.isPublicRestricted, expectedStatus === "expired");
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

for (const [count, limit, remaining, reached] of [
  [0, 18, 18, false], [17, 18, 1, false], [18, 18, 0, true], [19, 18, 0, true],
] as const) {
  test(`room limit override ${limit} at ${count} active rooms`, () => {
    const state = calculate({ ...row, room_limit_override: limit }, count);
    assert.equal(state.roomLimit, limit);
    assert.equal(state.roomLimitOverride, limit);
    assert.equal(state.remainingRoomSlots, remaining);
    assert.equal(state.isRoomLimitReached, reached);
    assert.equal(state.canAddActiveRoom, !reached);
  });
}

for (const [count, remaining, reached] of [
  [0, 15, false], [14, 1, false], [15, 0, true], [16, 0, true],
] as const) {
  test(`Bronly room limit at ${count} active rooms`, () => {
    const state = calculate(null, count);
    assert.equal(state.planName, "Bronly");
    assert.equal(state.roomLimit, 15);
    assert.equal(state.roomLimitOverride, null);
    assert.equal(state.remainingRoomSlots, remaining);
    assert.equal(state.isRoomLimitReached, reached);
    assert.equal(state.canAddActiveRoom, !reached);
    assert.equal(state.status, "expired");
  });
}

test("the effective room capacity is exhausted at the configured limit", () => {
  assert.equal(isRoomLimitReached(14, 15), false);
  assert.equal(isRoomLimitReached(15, 15), true);
});

test("database room-limit guard maps back to the same form feedback", () => {
  assert.equal(mapActionError({ code: "P0001", message: "room_limit_reached" }), "room-limit");
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

test("a new trial schedule lasts 30 days and gets a three-day grace period", () => {
  const schedule = buildSubscriptionSchedule({
    status: "trial",
    now: new Date("2026-06-01T12:00:00.000Z"),
    trialEndsAt: null,
    graceEndsAt: null,
    paidUntil: null,
  });

  assert.equal(schedule.trialEndsAt, "2026-07-01T12:00:00.000Z");
  assert.equal(schedule.graceEndsAt, "2026-07-04T12:00:00.000Z");
});

test("owner and agent contexts apply identical supplied room limits", () => {
  for (const roleContext of ["owner", "agent"] as const) {
    const state = calculateSubscriptionRuntimeState({
      profileId: "profile-1", roleContext, subscriptionRow: { ...row, role_context: roleContext },
      activeRoomCount: 15, now: new Date("2026-06-01T00:00:00.000Z"),
    });
    assert.equal(state.isRoomLimitReached, true);
    assert.equal(state.roleContext, roleContext);
    assert.equal(state.status, "active");
  }
});
