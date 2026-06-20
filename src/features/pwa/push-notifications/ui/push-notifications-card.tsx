"use client";

import { useEffect, useState, useTransition } from "react";

import {
  getBrowserPushSupport,
  getExistingBrowserPushSubscription,
  subscribeBrowserToPush,
  unsubscribeBrowserFromPush,
} from "@/features/pwa/push-notifications/model/browser-push";
import { Button } from "@/shared/ui";

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
    throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РїРѕРґРїРёСЃРєСѓ РЅР° push-СѓРІРµРґРѕРјР»РµРЅРёСЏ.");
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
    throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєР»СЋС‡РёС‚СЊ push-СѓРІРµРґРѕРјР»РµРЅРёСЏ.");
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
            text: "Push-СѓРІРµРґРѕРјР»РµРЅРёСЏ РїРѕРєР° РЅРµ РЅР°СЃС‚СЂРѕРµРЅС‹ РґР»СЏ СЌС‚РѕРіРѕ РѕРєСЂСѓР¶РµРЅРёСЏ.",
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
              ? "Push-СѓРІРµРґРѕРјР»РµРЅРёСЏ РІРєР»СЋС‡РµРЅС‹ РґР»СЏ СЌС‚РѕРіРѕ СѓСЃС‚СЂРѕР№СЃС‚РІР°."
              : "РџРѕРґРїРёСЃРєР° СЃРѕС…СЂР°РЅРµРЅР°. Р’РЅРµС€РЅСЏСЏ РѕС‚РїСЂР°РІРєР° СЃС‚Р°РЅРµС‚ РґРѕСЃС‚СѓРїРЅР° РїРѕСЃР»Рµ СЃРµСЂРІРµСЂРЅРѕР№ РЅР°СЃС‚СЂРѕР№РєРё push.",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РІРєР»СЋС‡РёС‚СЊ push-СѓРІРµРґРѕРјР»РµРЅРёСЏ.";
        setPermission(Notification.permission);
        setStatusMessage({
          tone: "warning",
          text:
            message === "Push permission denied."
              ? "Р‘СЂР°СѓР·РµСЂ Р·Р°РїСЂРµС‚РёР» push-СѓРІРµРґРѕРјР»РµРЅРёСЏ. Р Р°Р·СЂРµС€РµРЅРёРµ РјРѕР¶РЅРѕ РёР·РјРµРЅРёС‚СЊ РІ РЅР°СЃС‚СЂРѕР№РєР°С… Р±СЂР°СѓР·РµСЂР°."
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
          text: "Push-СѓРІРµРґРѕРјР»РµРЅРёСЏ РѕС‚РєР»СЋС‡РµРЅС‹ РґР»СЏ СЌС‚РѕРіРѕ СѓСЃС‚СЂРѕР№СЃС‚РІР°.",
        });
      } catch (error) {
        setStatusMessage({
          tone: "warning",
          text: error instanceof Error ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєР»СЋС‡РёС‚СЊ push-СѓРІРµРґРѕРјР»РµРЅРёСЏ.",
        });
      }
    });
  }

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Push-СѓРІРµРґРѕРјР»РµРЅРёСЏ</h2>
          <p>РџРѕР»СѓС‡Р°Р№С‚Рµ РєР»СЋС‡РµРІС‹Рµ СЃРѕР±С‹С‚РёСЏ MVP РїСЂСЏРјРѕ РІ PWA РЅР° СЌС‚РѕРј СѓСЃС‚СЂРѕР№СЃС‚РІРµ.</p>
        </div>
      </div>

      <div className="br-owner-stack">
        <p className="br-owner-muted">
          {permission === "unsupported"
            ? "Р­С‚РѕС‚ Р±СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ push-СѓРІРµРґРѕРјР»РµРЅРёСЏ."
            : permission === "denied"
              ? "Р Р°Р·СЂРµС€РµРЅРёРµ РЅР° push-СѓРІРµРґРѕРјР»РµРЅРёСЏ СЃРµР№С‡Р°СЃ РѕС‚РєР»СЋС‡РµРЅРѕ РІ Р±СЂР°СѓР·РµСЂРµ."
              : isActive
                ? "Push-СѓРІРµРґРѕРјР»РµРЅРёСЏ РІРєР»СЋС‡РµРЅС‹ РґР»СЏ СЌС‚РѕРіРѕ СѓСЃС‚СЂРѕР№СЃС‚РІР°."
                : hasServerSubscriptions
                  ? "Р”Р»СЏ Р°РєРєР°СѓРЅС‚Р° СѓР¶Рµ РµСЃС‚СЊ СЃРѕС…СЂР°РЅРµРЅРЅС‹Рµ push-РїРѕРґРїРёСЃРєРё. РќР° СЌС‚РѕРј СѓСЃС‚СЂРѕР№СЃС‚РІРµ push РјРѕР¶РЅРѕ РІРєР»СЋС‡РёС‚СЊ РѕС‚РґРµР»СЊРЅРѕ."
                  : "Push-СѓРІРµРґРѕРјР»РµРЅРёСЏ РїРѕРєР° РЅРµ РІРєР»СЋС‡РµРЅС‹."}
        </p>

        {deliveryMode === "foundation_only" ? (
          <div className="br-inline-notice">
            РџРѕРґРїРёСЃРєР° Рё Р·Р°РїРёСЃСЊ РґРѕСЃС‚Р°РІРѕРє СѓР¶Рµ СЂР°Р±РѕС‚Р°СЋС‚. Р’РЅРµС€РЅСЏСЏ РѕС‚РїСЂР°РІРєР° push Р±СѓРґРµС‚ Р°РєС‚РёРІРёСЂРѕРІР°РЅР° РїРѕСЃР»Рµ РЅР°СЃС‚СЂРѕР№РєРё СЃРµСЂРІРµСЂРЅС‹С… VAPID-РєР»СЋС‡РµР№.
          </div>
        ) : null}

        {statusMessage ? (
          <p className={statusMessage.tone === "warning" ? "br-owner-error" : "br-owner-muted"}>{statusMessage.text}</p>
        ) : null}

        <div className="br-owner-actions">
          <Button
            type="button"
            onClick={isActive ? handleDisable : handleEnable}
            disabled={permission === "unsupported"}
            isLoading={isPending}
            loadingLabel="Сохранение"
          >
            {isActive ? "РћС‚РєР»СЋС‡РёС‚СЊ push-СѓРІРµРґРѕРјР»РµРЅРёСЏ" : "Р’РєР»СЋС‡РёС‚СЊ push-СѓРІРµРґРѕРјР»РµРЅРёСЏ"}
          </Button>
        </div>
      </div>
    </section>
  );
}
