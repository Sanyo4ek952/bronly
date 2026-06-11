import {
  createSupabaseAdminClient,
  getTelegramBotToken,
  hasConfiguredTelegramBot,
  requireAppUrl,
  type SupabaseNotificationRow,
  type SupabaseNotificationSettingsRow,
  type SupabaseTelegramNotificationConnectionRow,
} from "@/shared/api/supabase";
import type { NotificationCopy } from "@/entities/notification/api/push-delivery";

type TelegramDeliveryStatus =
  | "sent"
  | "pending_configuration"
  | "skipped_disabled"
  | "skipped_not_linked"
  | "failed";

function getBaseUrl() {
  return requireAppUrl();
}

function getNotificationUrl(notification: Pick<SupabaseNotificationRow, "payload">) {
  const path =
    notification.payload?.linkPath ??
    (notification.payload?.roleContext === "agent" ? "/agent/dashboard/notifications" : "/dashboard/notifications");

  return new URL(path, getBaseUrl()).toString();
}

function escapeTelegramHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildTelegramMessage(
  notification: Pick<SupabaseNotificationRow, "payload">,
  copy: NotificationCopy,
) {
  return [
    `<b>${escapeTelegramHtml(copy.title)}</b>`,
    escapeTelegramHtml(copy.description),
    "",
    `<a href="${escapeTelegramHtml(getNotificationUrl(notification))}">${escapeTelegramHtml(copy.linkLabel)}</a>`,
  ].join("\n");
}

async function saveTelegramDeliveryRecord(input: {
  notificationId: string;
  recipientId: string;
  telegramChatId: string | null;
  status: TelegramDeliveryStatus;
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
}) {
  const admin = createSupabaseAdminClient();

  await admin.from("notification_deliveries").insert({
    notification_id: input.notificationId,
    recipient_id: input.recipientId,
    channel: "telegram",
    push_subscription_id: null,
    telegram_chat_id: input.telegramChatId,
    status: input.status,
    provider_message_id: input.providerMessageId ?? null,
    error_code: input.errorCode ?? null,
    error_message: input.errorMessage ?? null,
    sent_at: input.sentAt ?? null,
  });
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token = getTelegramBotToken();

  if (!token) {
    throw new Error("Telegram bot token is not configured.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        result?: { message_id?: number };
        error_code?: number;
        description?: string;
      }
    | null;

  if (!response.ok || !payload?.ok) {
    const message = payload?.description || `Telegram delivery failed with status ${response.status}.`;
    const error = new Error(message);
    Object.assign(error, { statusCode: payload?.error_code ?? response.status });
    throw error;
  }

  return {
    messageId: payload.result?.message_id ? String(payload.result.message_id) : null,
  };
}

export async function deliverTelegramNotification(input: {
  notification: Pick<SupabaseNotificationRow, "id" | "recipient_id" | "payload">;
  copy: NotificationCopy;
}) {
  const admin = createSupabaseAdminClient();
  const [{ data: settingsData }, { data: connectionData }] = await Promise.all([
    admin.from("notification_settings").select("*").eq("profile_id", input.notification.recipient_id).maybeSingle(),
    admin
      .from("telegram_notification_connections")
      .select("*")
      .eq("profile_id", input.notification.recipient_id)
      .maybeSingle(),
  ]);

  const settings = (settingsData as SupabaseNotificationSettingsRow | null) ?? null;
  const connection = (connectionData as SupabaseTelegramNotificationConnectionRow | null) ?? null;

  if (settings?.telegram_enabled === false) {
    await saveTelegramDeliveryRecord({
      notificationId: input.notification.id,
      recipientId: input.notification.recipient_id,
      telegramChatId: connection?.telegram_chat_id ?? null,
      status: "skipped_disabled",
    });
    return;
  }

  if (!connection?.telegram_chat_id || !connection.linked_at) {
    await saveTelegramDeliveryRecord({
      notificationId: input.notification.id,
      recipientId: input.notification.recipient_id,
      telegramChatId: connection?.telegram_chat_id ?? null,
      status: "skipped_not_linked",
    });
    return;
  }

  if (!hasConfiguredTelegramBot()) {
    await saveTelegramDeliveryRecord({
      notificationId: input.notification.id,
      recipientId: input.notification.recipient_id,
      telegramChatId: connection.telegram_chat_id,
      status: "pending_configuration",
    });
    return;
  }

  try {
    const result = await sendTelegramMessage(connection.telegram_chat_id, buildTelegramMessage(input.notification, input.copy));

    await saveTelegramDeliveryRecord({
      notificationId: input.notification.id,
      recipientId: input.notification.recipient_id,
      telegramChatId: connection.telegram_chat_id,
      status: "sent",
      providerMessageId: result.messageId,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Telegram delivery failed.";
    const errorCode =
      typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number"
        ? String(error.statusCode)
        : null;

    await saveTelegramDeliveryRecord({
      notificationId: input.notification.id,
      recipientId: input.notification.recipient_id,
      telegramChatId: connection.telegram_chat_id,
      status: "failed",
      errorCode,
      errorMessage,
    });
  }
}
