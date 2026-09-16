"use client";

import { BellRing } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";

import {
  getBrowserPushSupport,
  getExistingBrowserPushSubscription,
  subscribeBrowserToPush,
} from "@/features/pwa/push-notifications/model/browser-push";
import { Button, InlineNotice, Panel } from "@/shared/ui";

type PushNotificationsCardProps = {
  deliveryMode: "enabled" | "foundation_only";
  hasServerSubscriptions: boolean;
  initialPushEnabled: boolean;
  presentation?: "default" | "owner";
};

type StatusMessage = {
  tone: "muted" | "warning";
  text: string;
};

function subscribeToBrowserSupport() {
  return () => undefined;
}

function getBrowserPermissionSnapshot() {
  return getBrowserPushSupport().permission;
}

function getServerPermissionSnapshot(): NotificationPermission | "unsupported" {
  return "unsupported";
}

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
  presentation = "default",
}: PushNotificationsCardProps) {
  const [isPending, startTransition] = useTransition();
  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [hasCurrentSubscription, setHasCurrentSubscription] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const browserPermission = useSyncExternalStore(
    subscribeToBrowserSupport,
    getBrowserPermissionSnapshot,
    getServerPermissionSnapshot,
  );
  const [permissionOverride, setPermissionOverride] = useState<NotificationPermission | null>(null);
  const permission = permissionOverride ?? browserPermission;
  const isSupported = browserPermission !== "unsupported";

  useEffect(() => {
    if (!isSupported) {
      return;
    }
    void getExistingBrowserPushSubscription()
      .then((subscription) => {
        setHasCurrentSubscription(Boolean(subscription));
      })
      .catch(() => {
        setHasCurrentSubscription(false);
      });
  }, [isSupported]);

  const isActive = pushEnabled && hasCurrentSubscription;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const statusText =
    permission === "unsupported"
      ? "Этот браузер не поддерживает push-уведомления."
      : permission === "denied"
        ? "Разрешение на push-уведомления сейчас отключено в браузере."
        : isActive
          ? "Push-уведомления включены для этого устройства."
          : hasServerSubscriptions
            ? "Для аккаунта уже есть сохраненные push-подписки. На этом устройстве push можно включить отдельно."
            : "Push-уведомления пока не включены.";

  function handleEnable() {
    startTransition(async () => {
      try {
        if (!isSupported) {
          setStatusMessage({ tone: "warning", text: "Этот браузер не поддерживает push-уведомления." });
          return;
        }

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
        setPermissionOverride("granted");
        setStatusMessage({
          tone: "muted",
          text:
            deliveryMode === "enabled"
              ? "Push-уведомления включены для этого устройства."
              : "Подписка сохранена. Внешняя отправка станет доступна после серверной настройки push.",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось включить push-уведомления.";
        setPermissionOverride(Notification.permission);
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
        const subscription = await getExistingBrowserPushSubscription();

        if (subscription?.endpoint) {
          await deleteSubscription(subscription.endpoint);
          const unsubscribed = await subscription.unsubscribe();

          if (!unsubscribed) {
            throw new Error("Браузер не смог отключить локальную push-подписку.");
          }
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

  if (presentation === "owner") {
    return (
      <Panel
        as="aside"
        className="grid min-w-0 gap-[18px] p-[22px] shadow-[var(--shadow-md)] max-[640px]:p-4 xl:sticky xl:top-6"
        aria-labelledby="owner-push-notifications-title"
      >
        <div className="grid size-11 place-items-center rounded-[15px] bg-[var(--surface-muted)] text-[var(--accent-strong)]" aria-hidden="true">
          <BellRing className="size-5" strokeWidth={2} />
        </div>

        <div className="grid gap-2">
          <h2 id="owner-push-notifications-title" className="text-[22px] font-bold leading-[1.15] tracking-[-0.025em] text-[var(--text)]">
            Push на устройстве
          </h2>
          <p className="text-sm leading-[1.55] text-[var(--text-muted)]">
            Получайте важные события прямо в установленном PWA.
          </p>
        </div>

        <p className="text-sm font-semibold leading-[1.55] text-[var(--text-muted)]">{statusText}</p>

        {deliveryMode === "foundation_only" ? (
          <InlineNotice tone="warning">
            Подписка и запись доставок уже работают. Внешняя отправка push будет активирована после настройки серверных
            VAPID-ключей.
          </InlineNotice>
        ) : null}

        {statusMessage ? (
          <InlineNotice tone={statusMessage.tone === "warning" ? "warning" : "soft"} aria-live="polite">
            {statusMessage.text}
          </InlineNotice>
        ) : null}

        <Button
          type="button"
          onClick={isActive ? handleDisable : handleEnable}
          disabled={!isSupported}
          isLoading={isPending}
          loadingLabel="Сохранение"
          fullWidth
          className="min-h-11"
        >
          {isActive ? "Отключить push-уведомления" : "Включить push-уведомления"}
        </Button>
      </Panel>
    );
  }

  return (
    <Panel className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
      <div className="grid gap-1.5">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Push-уведомления</h2>
          <p className="mt-1.5 text-sm leading-[1.5] text-[var(--text-muted)]">Получайте события по заявкам, предложениям и подписке прямо в PWA на этом устройстве.</p>
        </div>
      </div>

      <div className="grid gap-3">
        <p className="text-sm leading-[1.5] text-[var(--text-muted)]">{statusText}</p>

        {deliveryMode === "foundation_only" ? (
          <InlineNotice tone="warning">
            Подписка и запись доставок уже работают. Внешняя отправка push будет активирована после настройки серверных
            VAPID-ключей.
          </InlineNotice>
        ) : null}

        {statusMessage ? (
          <InlineNotice tone={statusMessage.tone === "warning" ? "warning" : "soft"} aria-live="polite">
            {statusMessage.text}
          </InlineNotice>
        ) : null}

        <div className="flex flex-wrap gap-2.5">
          <Button
            type="button"
            onClick={isActive ? handleDisable : handleEnable}
            disabled={!isSupported}
            isLoading={isPending}
            loadingLabel="Сохранение"
          >
            {isActive ? "Отключить push-уведомления" : "Включить push-уведомления"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
