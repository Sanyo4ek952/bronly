import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  NOTIFICATION_EVENT_TYPES,
  buildNotificationIdempotencyKey,
  getNotificationDeliveryChannels,
  getNotificationDestinationPath,
  settleNotificationFanOut,
} from "../../src/entities/notification/model/notification-rules.ts";

test("every MVP notification event fans out to push and Telegram without one failure rejecting the fan-out", async () => {
  for (const eventType of NOTIFICATION_EVENT_TYPES) {
    assert.deepEqual(getNotificationDeliveryChannels(eventType), ["push", "telegram"]);
  }

  const attempted: string[] = [];
  const results = await settleNotificationFanOut(["push", "telegram"], async (channel) => {
    attempted.push(channel);

    if (channel === "push") {
      throw new Error("provider unavailable");
    }
  });

  assert.deepEqual(attempted.sort(), ["push", "telegram"]);
  assert.deepEqual(results.map(({ channel, status }) => ({ channel, status })), [
    { channel: "push", status: "rejected" },
    { channel: "telegram", status: "fulfilled" },
  ]);
});

test("notification destinations are role-safe and never depend on an arbitrary payload URL", () => {
  assert.equal(getNotificationDestinationPath("new_request", "owner"), "/dashboard/requests");
  assert.equal(getNotificationDestinationPath("new_request", "agent"), "/agent/dashboard/requests");
  assert.equal(
    getNotificationDestinationPath("new_request", undefined, "/agent/dashboard/requests"),
    "/agent/dashboard/requests",
  );
  assert.equal(
    getNotificationDestinationPath("new_request", "owner", "https://example.com/private"),
    "/dashboard/requests",
  );
  assert.equal(getNotificationDestinationPath("request_transferred_to_owner", "agent"), "/dashboard/requests");
  assert.equal(getNotificationDestinationPath("agent_proposal_received", "agent"), "/dashboard/agent-proposals");
  assert.equal(getNotificationDestinationPath("agent_proposal_accepted", "owner"), "/agent/dashboard/collaborations");
  assert.equal(getNotificationDestinationPath("agent_proposal_rejected", "owner"), "/agent/dashboard/opportunities");
  assert.equal(getNotificationDestinationPath("subscription_reminder", "agent"), "/agent/dashboard/subscription");
});

test("notification idempotency keys are deterministic and distinguish repeated business occurrences", () => {
  const base = {
    eventType: "agent_proposal_received" as const,
    sourceId: "proposal-1",
  };

  assert.equal(
    buildNotificationIdempotencyKey(base),
    buildNotificationIdempotencyKey({ ...base }),
  );
  assert.notEqual(
    buildNotificationIdempotencyKey({ ...base, occurrence: "2026-09-15T10:00:00.000Z" }),
    buildNotificationIdempotencyKey({ ...base, occurrence: "2026-09-15T11:00:00.000Z" }),
  );
  assert.throws(
    () => buildNotificationIdempotencyKey({ eventType: "new_request", sourceId: "  " }),
    /source identifier/i,
  );
});

test("notification storage enforces idempotent in-app events and one delivery status per channel target", () => {
  const sql = readFileSync("supabase/migrations/202609150004_notifications_pwa_hardening.sql", "utf8");
  const notificationData = readFileSync("src/entities/notification/api/notification-data.ts", "utf8");
  const pushDelivery = readFileSync("src/entities/notification/api/push-delivery.ts", "utf8");
  const telegramDelivery = readFileSync("src/entities/notification/api/telegram-delivery.ts", "utf8");

  assert.match(sql, /notifications\(recipient_id, event_type, idempotency_key\)/);
  assert.match(sql, /notification_deliveries\(notification_id, channel, delivery_target_key\)/);
  assert.match(notificationData, /ignoreDuplicates: true/);
  assert.match(pushDelivery, /onConflict: "notification_id,channel,delivery_target_key"/);
  assert.match(telegramDelivery, /onConflict: "notification_id,channel,delivery_target_key"/);
});

test("the service worker confines notification navigation to the Bronly origin", () => {
  const serviceWorker = readFileSync("public/sw.js", "utf8");

  assert.match(serviceWorker, /url\.origin !== self\.location\.origin/);
  assert.match(serviceWorker, /getSafeClientUrl\(payload\.url/);
  assert.match(serviceWorker, /notificationclick/);
});
