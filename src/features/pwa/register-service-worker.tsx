"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    const isLocalDevelopment =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (process.env.NODE_ENV !== "production" && !isLocalDevelopment) {
      return;
    }

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // The install UI remains usable even if SW registration is blocked.
    });
  }, []);

  return null;
}
