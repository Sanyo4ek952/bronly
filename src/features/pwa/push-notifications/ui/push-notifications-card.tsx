"use client";

import { useEffect, useState, useTransition } from "react";

import {
  getBrowserPushSupport,
  getExistingBrowserPushSubscription,
  subscribeBrowserToPush,
  unsubscribeBrowserFromPush,
} from "@/features/pwa/push-notifications/model/browser-push";

type PushNotificationsCardProps = {
  deliveryMode: "enabled" | "foundation_only";
  hasServerSubscriptions: boolean;
  initialPushEnabled: boolean;
};

type StatusMessage = {
  tone: "muted" | "warning";
  text: string;
};

async function saveSubscription(payload: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent: string | null;
}) {
  const response = await fetch("/api/push-subscriptions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Не удалось сохранить подписку на push-уведомления.");
  }
}

async function deleteSubscription(endpoint: string) {
  const response = await fetch("/api/push-subscriptions", {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ endpoint }),
  });

  if (!response.ok) {
    throw new Error("Не удалось отключить push-уведомления.");
  }
}

export function PushNotificationsCard({
  deliveryMode,
  hasServerSubscriptions,
  initialPushEnabled,
}: PushNotificationsCardProps) {
  const support = getBrowserPushSupport();
  const [isPending, startTransition] = useTransition();
  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [hasCurrentSubscription, setHasCurrentSubscription] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(support.permission);

  useEffect(() => {
    if (!support.isSupported) {
      return;
    }
    void getExistingBrowserPushSubscription()
      .then((subscription) => {
        setHasCurrentSubscription(Boolean(subscription));
      })
      .catch(() => {
        setHasCurrentSubscription(false);
      });
  }, [support.isSupported, support.permission]);

  const isActive = pushEnabled && hasCurrentSubscription;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  function handleEnable() {
    startTransition(async () => {
      try {
        if (!vapidPublicKey) {
          setStatusMessage({
            tone: "warning",
            text: "Push-уведомления пока не настроены для этого окружения.",
          });
          return;
        }

        const subscription = await subscribeBrowserToPush(vapidPublicKey);
        await saveSubscription({
          ...subscription,
          userAgent: typeof navigator === "undefined" ? null : navigator.userAgent,
        });

        setPushEnabled(true);
        setHasCurrentSubscription(true);
        setPermission("granted");
        setStatusMessage({
          tone: "muted",
          text:
            deliveryMode === "enabled"
              ? "Push-уведомления включены для этого устройства."
              : "Подписка сохранена. Внешняя отправка станет доступна после серверной настройки push.",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось включить push-уведомления.";
        setPermission(Notification.permission);
        setStatusMessage({
          tone: "warning",
          text:
            message === "Push permission denied."
              ? "Браузер запретил push-уведомления. Разрешение можно изменить в настройках браузера."
              : message,
        });
      }
    });
  }

  function handleDisable() {
    startTransition(async () => {
      try {
        const result = await unsubscribeBrowserFromPush();

        if (result.endpoint) {
          await deleteSubscription(result.endpoint);
        }

        setPushEnabled(false);
        setHasCurrentSubscription(false);
        setStatusMessage({
          tone: "muted",
          text: "Push-уведомления отключены для этого устройства.",
        });
      } catch (error) {
        setStatusMessage({
          tone: "warning",
          text: error instanceof Error ? error.message : "Не удалось отключить push-уведомления.",
        });
      }
    });
  }

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Push-уведомления</h2>
          <p>Получайте ключевые события MVP прямо в PWA на этом устройстве.</p>
        </div>
      </div>

      <div className="br-owner-stack">
        <p className="br-owner-muted">
          {permission === "unsupported"
            ? "Этот браузер не поддерживает push-уведомления."
            : permission === "denied"
              ? "Разрешение на push-уведомления сейчас отключено в браузере."
              : isActive
                ? "Push-уведомления включены для этого устройства."
                : hasServerSubscriptions
                  ? "Для аккаунта уже есть сохраненные push-подписки. На этом устройстве push можно включить отдельно."
                  : "Push-уведомления пока не включены."}
        </p>

        {deliveryMode === "foundation_only" ? (
          <div className="br-inline-notice">
            Подписка и запись доставок уже работают. Внешняя отправка push будет активирована после настройки серверных VAPID-ключей.
          </div>
        ) : null}

        {statusMessage ? (
          <p className={statusMessage.tone === "warning" ? "br-owner-error" : "br-owner-muted"}>{statusMessage.text}</p>
        ) : null}

        <div className="br-owner-actions">
          <button
            className="br-button br-button--primary"
            type="button"
            onClick={isActive ? handleDisable : handleEnable}
            disabled={isPending || permission === "unsupported"}
          >
            {isPending
              ? "Сохраняем..."
              : isActive
                ? "Отключить push-уведомления"
                : "Включить push-уведомления"}
          </button>
        </div>
      </div>
    </section>
  );
}
