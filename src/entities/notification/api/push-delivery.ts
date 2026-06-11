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

  await admin.from("notification_deliveries").insert({
    notification_id: input.notificationId,
    recipient_id: input.recipientId,
    channel: "push",
    push_subscription_id: input.pushSubscriptionId,
    telegram_chat_id: input.telegramChatId ?? null,
    status: input.status,
    provider_message_id: input.providerMessageId ?? null,
    error_code: input.errorCode ?? null,
    error_message: input.errorMessage ?? null,
    sent_at: input.sentAt ?? null,
  });
}

async function sendViaWebPush(subscription: SupabasePushSubscriptionRow, payload: PushPayload) {
  const importModule = new Function("moduleName", "return import(moduleName);") as (
    moduleName: string,
  ) => Promise<unknown>;
  const imported = (await importModule("web-push")) as {
    sendNotification?: (
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
      payload: string,
    ) => Promise<{ statusCode?: number; headers?: Record<string, string> }>;
    setVapidDetails?: (subject: string, publicKey: string, privateKey: string) => void;
  };

  if (!imported.sendNotification || !imported.setVapidDetails) {
    throw new Error("web-push module is not available.");
  }

  imported.setVapidDetails(
    getVapidSubject() ?? "mailto:push@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
    getVapidPrivateKey() ?? "",
  );

  return imported.sendNotification(
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
  const [{ data: settingsData }, { data: subscriptionRows }] = await Promise.all([
    admin.from("notification_settings").select("*").eq("profile_id", input.notification.recipient_id).maybeSingle(),
    admin
      .from("push_subscriptions")
      .select("*")
      .eq("profile_id", input.notification.recipient_id)
      .order("updated_at", { ascending: false }),
  ]);

  const settings = (settingsData as SupabaseNotificationSettingsRow | null) ?? null;
  const subscriptions = (subscriptionRows as SupabasePushSubscriptionRow[] | null) ?? [];

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

  const payload = buildPushPayload(input.notification, input.copy);

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
      }
    }),
  );
}
