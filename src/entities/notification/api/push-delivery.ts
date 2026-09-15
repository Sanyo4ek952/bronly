import webPush from "web-push";

import {
  createSupabaseAdminClient,
  getVapidPrivateKey,
  getVapidSubject,
  hasConfiguredWebPush,
  requireAppUrl,
  type SupabaseNotificationSettingsRow,
  type SupabaseNotificationRow,
  type SupabasePushSubscriptionRow,
} from "@/shared/api/supabase";
import { logServerDataError } from "@/shared/api/supabase/server-diagnostics";

export type NotificationCopy = {
  title: string;
  description: string;
  linkLabel: string;
};

export type PushDeliveryStatus =
  | "sent"
  | "pending_configuration"
  | "skipped_disabled"
  | "skipped_no_subscriptions"
  | "failed";

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  icon: string;
  badge: string;
};

function getBaseUrl() {
  return requireAppUrl();
}

function toAbsoluteUrl(path: string) {
  return new URL(path, getBaseUrl()).toString();
}

function getFallbackNotificationsPath(notification: Pick<SupabaseNotificationRow, "payload">) {
  if (notification.payload?.linkPath) {
    return notification.payload.linkPath;
  }

  return notification.payload?.roleContext === "agent"
    ? "/agent/dashboard/notifications"
    : "/dashboard/notifications";
}

function buildPushPayload(notification: Pick<SupabaseNotificationRow, "id" | "event_type" | "payload">, copy: NotificationCopy): PushPayload {
  return {
    title: copy.title,
    body: copy.description,
    url: getFallbackNotificationsPath(notification),
    tag: `notification:${notification.event_type}:${notification.id}`,
    icon: toAbsoluteUrl("/icon"),
    badge: toAbsoluteUrl("/icon"),
  };
}

export async function savePushDeliveryRecord(input: {
  notificationId: string;
  recipientId: string;
  pushSubscriptionId: string | null;
  telegramChatId?: string | null;
  status: PushDeliveryStatus;
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { error } = await admin.from("notification_deliveries").upsert(
    {
      notification_id: input.notificationId,
      recipient_id: input.recipientId,
      channel: "push",
      delivery_target_key: input.pushSubscriptionId ?? "channel",
      push_subscription_id: input.pushSubscriptionId,
      telegram_chat_id: input.telegramChatId ?? null,
      status: input.status,
      provider_message_id: input.providerMessageId ?? null,
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ?? null,
      sent_at: input.sentAt ?? null,
      updated_at: nowIso,
    },
    { onConflict: "notification_id,channel,delivery_target_key" },
  );

  if (error) {
    logServerDataError("push_delivery_status_save_failed", error, {
      notificationId: input.notificationId,
      status: input.status,
    });
    throw error;
  }
}

async function sendViaWebPush(subscription: SupabasePushSubscriptionRow, payload: PushPayload) {
  webPush.setVapidDetails(
    getVapidSubject() ?? "mailto:push@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
    getVapidPrivateKey() ?? "",
  );

  return webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify(payload),
  );
}

export async function deliverPushNotification(input: {
  notification: Pick<SupabaseNotificationRow, "id" | "recipient_id" | "event_type" | "payload">;
  copy: NotificationCopy;
}) {
  const admin = createSupabaseAdminClient();
  const [settingsResult, subscriptionsResult] = await Promise.all([
    admin.from("notification_settings").select("*").eq("profile_id", input.notification.recipient_id).maybeSingle(),
    admin
      .from("push_subscriptions")
      .select("*")
      .eq("profile_id", input.notification.recipient_id)
      .order("updated_at", { ascending: false }),
  ]);

  if (settingsResult.error || subscriptionsResult.error) {
    const queryError = settingsResult.error ?? subscriptionsResult.error ?? new Error("Push delivery lookup failed.");
    logServerDataError("push_delivery_lookup_failed", queryError, {
      notificationId: input.notification.id,
    });
    await savePushDeliveryRecord({
      notificationId: input.notification.id,
      recipientId: input.notification.recipient_id,
      pushSubscriptionId: null,
      status: "failed",
      errorCode: "lookup_failed",
      errorMessage: "Push delivery settings could not be loaded.",
    });
    return;
  }

  const settings = settingsResult.data ?? null;
  const subscriptions = subscriptionsResult.data ?? [];

  if (settings?.push_enabled === false) {
    await savePushDeliveryRecord({
      notificationId: input.notification.id,
      recipientId: input.notification.recipient_id,
      pushSubscriptionId: null,
      status: "skipped_disabled",
    });
    return;
  }

  if (!subscriptions.length) {
    await savePushDeliveryRecord({
      notificationId: input.notification.id,
      recipientId: input.notification.recipient_id,
      pushSubscriptionId: null,
      status: "skipped_no_subscriptions",
    });
    return;
  }

  if (!hasConfiguredWebPush()) {
    await Promise.all(
      subscriptions.map((subscription) =>
        savePushDeliveryRecord({
          notificationId: input.notification.id,
          recipientId: input.notification.recipient_id,
          pushSubscriptionId: subscription.id,
          status: "pending_configuration",
        }),
      ),
    );
    return;
  }

  let payload: PushPayload;

  try {
    payload = buildPushPayload(input.notification, input.copy);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Push payload could not be built.";
    await Promise.all(
      subscriptions.map((subscription) =>
        savePushDeliveryRecord({
          notificationId: input.notification.id,
          recipientId: input.notification.recipient_id,
          pushSubscriptionId: subscription.id,
          status: "failed",
          errorCode: "payload_failed",
          errorMessage,
        }),
      ),
    );
    return;
  }

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        const result = await sendViaWebPush(subscription, payload);
        const sentAt = new Date().toISOString();
        const providerMessageId =
          result.headers?.["x-request-id"] ?? result.headers?.["request-id"] ?? null;

        await savePushDeliveryRecord({
          notificationId: input.notification.id,
          recipientId: input.notification.recipient_id,
          pushSubscriptionId: subscription.id,
          status: "sent",
          providerMessageId,
          sentAt,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Push delivery failed.";
        const errorCode =
          typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number"
            ? String(error.statusCode)
            : null;

        await savePushDeliveryRecord({
          notificationId: input.notification.id,
          recipientId: input.notification.recipient_id,
          pushSubscriptionId: subscription.id,
          status: "failed",
          errorCode,
          errorMessage,
        });

        if (errorCode === "404" || errorCode === "410") {
          const { error: deleteError } = await admin
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id)
            .eq("profile_id", input.notification.recipient_id);

          if (deleteError) {
            logServerDataError("expired_push_subscription_delete_failed", deleteError, {
              notificationId: input.notification.id,
              pushSubscriptionId: subscription.id,
            });
          }
        }
      }
    }),
  );
}
