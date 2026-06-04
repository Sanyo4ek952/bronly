import type { SupabaseNotificationRow } from "@/shared/api/supabase/types";
import { deliverPushNotification, type NotificationCopy } from "@/entities/notification/api/push-delivery";
import { deliverTelegramNotification } from "@/entities/notification/api/telegram-delivery";

const TELEGRAM_SUPPORTED_EVENT_TYPES = new Set<
  SupabaseNotificationRow["event_type"]
>([
  "new_request",
  "request_transferred_to_owner",
  "agent_proposal_received",
  "agent_proposal_accepted",
  "agent_proposal_rejected",
  "subscription_reminder",
  "subscription_status_changed",
]);

export async function fanOutNotificationDeliveries(input: {
  notification: Pick<SupabaseNotificationRow, "id" | "recipient_id" | "event_type" | "payload">;
  copy: NotificationCopy;
}) {
  const tasks: Array<Promise<unknown>> = [deliverPushNotification(input)];

  if (TELEGRAM_SUPPORTED_EVENT_TYPES.has(input.notification.event_type)) {
    tasks.push(deliverTelegramNotification(input));
  }

  await Promise.allSettled(tasks);
}
