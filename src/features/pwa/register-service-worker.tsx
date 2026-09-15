"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    const setRegistrationStatus = (status: "unsupported" | "registering" | "registered" | "failed") => {
      document.documentElement.dataset.serviceWorkerStatus = status;
    };
    const isLocalDevelopment =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (process.env.NODE_ENV !== "production" && !isLocalDevelopment) {
      return;
    }

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setRegistrationStatus("unsupported");
      return;
    }

    setRegistrationStatus("registering");
    void navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .then(() => {
        setRegistrationStatus("registered");
      })
      .catch((error) => {
        setRegistrationStatus("failed");
        console.warn("Bronly service worker registration failed.", error);
      });
  }, []);

  return null;
}
