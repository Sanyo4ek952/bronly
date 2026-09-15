self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function getSafeClientUrl(value, fallback) {
  try {
    const url = new URL(value || fallback, self.location.origin);

    if (url.origin !== self.location.origin) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

self.addEventListener("push", (event) => {
  const payload = (() => {
    if (!event.data) {
      return {};
    }

    try {
      return event.data.json();
    } catch {
      return { body: event.data.text() };
    }
  })();

  const title = payload.title || "Bronly";
  const options = {
    body: payload.body || "У вас есть новое событие в Bronly.",
    icon: payload.icon || "/icon",
    badge: payload.badge || "/icon",
    tag: payload.tag || undefined,
    data: {
      url: getSafeClientUrl(payload.url, "/dashboard/notifications"),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const requestedUrl =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/dashboard/notifications";
  const targetUrl = getSafeClientUrl(requestedUrl, "/dashboard/notifications");

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
