"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

type InstallState = "unsupported" | "ios" | "prompt" | "installed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const iosNavigator = window.navigator as Navigator & { standalone?: boolean };

  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

function detectIosSafari() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(userAgent);
  const isSafari = /safari/i.test(userAgent) && !/crios|fxios|edgios|opr\//i.test(userAgent);

  return isIos && isSafari;
}

type InstallAppCardProps = {
  embedded?: boolean;
};

export function InstallAppCard({ embedded = false }: InstallAppCardProps) {
  const [installState, setInstallState] = useState<InstallState>("unsupported");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPromptPending, setIsPromptPending] = useState(false);

  useEffect(() => {
    const syncInstallState = () => {
      if (isStandaloneMode()) {
        setInstallState("installed");
        return;
      }

      if (detectIosSafari()) {
        setInstallState("ios");
        return;
      }

      setInstallState((currentState) => (currentState === "prompt" ? currentState : "unsupported"));
    };

    syncInstallState();

    const standaloneMediaQuery = window.matchMedia("(display-mode: standalone)");

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
      setInstallState("prompt");
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallState("installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    standaloneMediaQuery.addEventListener("change", syncInstallState);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      standaloneMediaQuery.removeEventListener("change", syncInstallState);
    };
  }, []);

  const description = useMemo(() => {
    switch (installState) {
      case "installed":
        return "Bronly уже добавлен на главный экран и открывается как отдельное приложение.";
      case "prompt":
        return "Добавьте Bronly на главный экран телефона для быстрого доступа к заявкам, календарю занятости и уведомлениям.";
      case "ios":
        return "Чтобы добавить Bronly на главный экран, откройте меню «Поделиться» в Safari и выберите «На экран Домой».";
      default:
        return "В этом браузере установка на главный экран сейчас недоступна. При необходимости откройте Bronly в поддерживаемом мобильном браузере.";
    }
  }, [installState]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    setIsPromptPending(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      setDeferredPrompt(null);

      if (choice.outcome === "accepted") {
        setInstallState("installed");
        return;
      }

      setInstallState(detectIosSafari() ? "ios" : "unsupported");
    } finally {
      setIsPromptPending(false);
    }
  };

  return (
    <div
      className={cn(
        "grid gap-3",
        !embedded && "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5",
      )}
      aria-live="polite"
    >
      {embedded ? (
        <h3 className="text-lg font-semibold text-[var(--text)]">{installState === "installed" ? "Приложение установлено" : "Установить приложение"}</h3>
      ) : (
        <strong className="text-sm text-[var(--text)]">{installState === "installed" ? "Приложение установлено" : "Установить приложение"}</strong>
      )}
      <p className="text-sm leading-[1.5] text-[var(--text-muted)]">{description}</p>
      {installState === "prompt" ? (
        <Button
          variant="secondary"
          fullWidth
          type="button"
          onClick={handleInstall}
          isLoading={isPromptPending}
          loadingLabel="Открываем установку"
        >
          Установить приложение
        </Button>
      ) : null}
    </div>
  );
}
