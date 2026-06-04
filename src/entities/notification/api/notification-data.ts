import { createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import type { SupabaseNotificationRow } from "@/shared/api/supabase/types";
import { formatDateTimeLabel } from "@/shared/lib/date";

import type { NotificationEventType, NotificationListItem, NotificationPayload } from "@/entities/notification/model/types";
import { fanOutPushNotification } from "@/entities/notification/api/push-delivery";

function formatSubscriptionStatusLabel(status?: NotificationPayload["subscriptionStatus"]) {
  switch (status) {
    case "trial":
      return "Пробный период";
    case "active":
      return "Активна";
    case "grace":
      return "Нужно продлить";
    case "expired":
      return "Доступ ограничен";
    case "manual":
      return "Продлена вручную";
    default:
      return "Обновлен";
  }
}

function buildPropertyRoomLabel(payload: NotificationPayload) {
  const parts = [payload.propertyTitle, payload.roomTitle].filter(Boolean);

  if (!parts.length) {
    return "Откройте детали в кабинете.";
  }

  if (parts.length === 1) {
    return `По объекту: ${parts[0]}.`;
  }

  return `${parts[0]} · ${parts[1]}.`;
}

export function getNotificationCopy(eventType: NotificationEventType, payload: NotificationPayload) {
  switch (eventType) {
    case "new_request":
      return {
        title: "Новая заявка",
        description: buildPropertyRoomLabel(payload),
        linkLabel: "Открыть заявки",
      };
    case "request_transferred_to_owner":
      return {
        title: "Заявка передана владельцу",
        description: buildPropertyRoomLabel(payload),
        linkLabel: "Открыть заявки",
      };
    case "agent_proposal_received":
      return {
        title: "Новое предложение агента",
        description: payload.propertyTitle
          ? `По объекту: ${payload.propertyTitle}.`
          : "Откройте список предложений в кабинете.",
        linkLabel: "Открыть предложения",
      };
    case "agent_proposal_accepted":
      return {
        title: "Предложение принято",
        description: payload.propertyTitle
          ? `Владелец принял предложение по объекту: ${payload.propertyTitle}.`
          : "Откройте связи в кабинете.",
        linkLabel: "Открыть связи",
      };
    case "agent_proposal_rejected":
      return {
        title: "Предложение отклонено",
        description: payload.propertyTitle
          ? `Владелец отклонил предложение по объекту: ${payload.propertyTitle}.`
          : "Откройте предложения в кабинете.",
        linkLabel: "Открыть предложения",
      };
    case "subscription_reminder":
      return {
        title: "Подписку нужно продлить",
        description: `Текущий статус: ${formatSubscriptionStatusLabel(payload.subscriptionStatus)}.`,
        linkLabel: "Открыть кабинет",
      };
    case "subscription_status_changed":
      return {
        title: "Статус подписки изменен",
        description: `Новый статус: ${formatSubscriptionStatusLabel(payload.subscriptionStatus)}.`,
        linkLabel: "Открыть кабинет",
      };
    default:
      return {
        title: "Новое уведомление",
        description: "Проверьте обновления в кабинете.",
        linkLabel: "Открыть кабинет",
      };
  }
}

function mapNotificationItem(row: SupabaseNotificationRow): NotificationListItem {
  const payload = row.payload ?? {};
  const copy = getNotificationCopy(row.event_type, payload);

  return {
    id: row.id,
    eventType: row.event_type,
    title: copy.title,
    description: copy.description,
    createdAt: row.created_at,
    createdAtLabel: formatDateTimeLabel(row.created_at),
    isRead: Boolean(row.read_at),
    readAt: row.read_at,
    linkPath: payload.linkPath ?? null,
    linkLabel: copy.linkLabel,
  };
}

export async function createInAppNotification(input: {
  recipientId: string;
  eventType: NotificationEventType;
  payload?: NotificationPayload;
}) {
  return createNotificationEvent(input);
}

export async function createNotificationEvent(input: {
  recipientId: string;
  eventType: NotificationEventType;
  payload?: NotificationPayload;
}) {
  const admin = createSupabaseAdminClient();
  const payload = input.payload ?? {};
  const { data, error } = await admin
    .from("notifications")
    .insert({
      recipient_id: input.recipientId,
      channel: "in_app",
      event_type: input.eventType,
      payload,
    })
    .select("*")
    .single();

  if (error) {
    return { ok: false as const, reason: "save_failed" as const };
  }

  const notification = data as SupabaseNotificationRow;
  const copy = getNotificationCopy(notification.event_type, notification.payload ?? {});

  try {
    await fanOutPushNotification({
      notification: {
        id: notification.id,
        recipient_id: notification.recipient_id,
        event_type: notification.event_type,
        payload: notification.payload ?? {},
      },
      copy,
    });
  } catch {
    // In-app notification remains the source of truth even if push delivery is not ready.
  }

  return { ok: true as const };
}

export async function getUnreadNotificationCount() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return 0;
  }

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  return count ?? 0;
}

export async function getMyNotifications(): Promise<NotificationListItem[]> {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = ((data ?? []) as SupabaseNotificationRow[]).sort((left, right) => {
    if (left.read_at && !right.read_at) {
      return 1;
    }

    if (!left.read_at && right.read_at) {
      return -1;
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

  return rows.map(mapNotificationItem);
}

export async function markNotificationRead(notificationId: string) {
  const profile = await getCurrentAuthProfile();

  if (!profile || !notificationId) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", profile.id)
    .is("read_at", null);

  if (error) {
    return { ok: false as const, reason: "save_failed" as const };
  }

  return { ok: true as const };
}

export async function markAllNotificationsRead() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", profile.id)
    .is("read_at", null);

  if (error) {
    return { ok: false as const, reason: "save_failed" as const };
  }

  return { ok: true as const };
}
