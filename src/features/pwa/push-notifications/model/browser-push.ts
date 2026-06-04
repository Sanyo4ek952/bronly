"use client";

export type BrowserPushSupport = {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
};

export type BrowserPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

function toUint8Array(base64String: string) {
  const normalized = base64String.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const decoded = window.atob(`${normalized}${padding}`);

  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

function mapSubscription(subscription: PushSubscription): BrowserPushSubscription {
  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");

  if (!p256dh || !auth) {
    throw new Error("Push subscription keys are unavailable.");
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: window.btoa(String.fromCharCode(...new Uint8Array(p256dh))),
      auth: window.btoa(String.fromCharCode(...new Uint8Array(auth))),
    },
  };
}

export function getBrowserPushSupport(): BrowserPushSupport {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return {
      isSupported: false,
      permission: "unsupported",
    };
  }

  return {
    isSupported: true,
    permission: Notification.permission,
  };
}

export async function getExistingBrowserPushSubscription() {
  const support = getBrowserPushSupport();

  if (!support.isSupported) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeBrowserToPush(vapidPublicKey: string) {
  const support = getBrowserPushSupport();

  if (!support.isSupported) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(permission === "denied" ? "Push permission denied." : "Push permission was not granted.");
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8Array(vapidPublicKey),
    }));

  return mapSubscription(subscription);
}

export async function unsubscribeBrowserFromPush() {
  const existingSubscription = await getExistingBrowserPushSubscription();

  if (!existingSubscription) {
    return { endpoint: null };
  }

  const endpoint = existingSubscription.endpoint;
  await existingSubscription.unsubscribe();

  return { endpoint };
}
