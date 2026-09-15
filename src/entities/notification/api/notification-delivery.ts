import type { SupabaseNotificationRow } from "@/shared/api/supabase/types";
import { deliverPushNotification, type NotificationCopy } from "@/entities/notification/api/push-delivery";
import { deliverTelegramNotification } from "@/entities/notification/api/telegram-delivery";
import {
  getNotificationDeliveryChannels,
  settleNotificationFanOut,
} from "@/entities/notification/model/notification-rules";

export async function fanOutNotificationDeliveries(input: {
  notification: Pick<SupabaseNotificationRow, "id" | "recipient_id" | "event_type" | "payload">;
  copy: NotificationCopy;
}) {
  return settleNotificationFanOut(
    getNotificationDeliveryChannels(input.notification.event_type),
    async (channel) => {
      if (channel === "push") {
        await deliverPushNotification(input);
        return;
      }

      await deliverTelegramNotification(input);
    },
  );
}
