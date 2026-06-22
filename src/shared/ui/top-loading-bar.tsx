"use client";

import { useEffect, useRef, useState, type MutableRefObject, type SetStateAction } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const INITIAL_PROGRESS = 0.08;
const REDUCED_MOTION_PROGRESS = 0.92;
const COMPLETE_HIDE_DELAY_MS = 180;
const TRICKLE_INTERVAL_MS = 180;
const FAILSAFE_TIMEOUT_MS = 12000;

function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function shouldStartForUrl(url: URL) {
  if (typeof window === "undefined") {
    return false;
  }

  if (url.origin !== window.location.origin) {
    return false;
  }

  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false;
  }

  return true;
}

export function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const isMountedRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const isActiveRef = useRef(false);
  const trickleTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const failsafeTimerRef = useRef<number | null>(null);
  const startTaskRef = useRef<number | null>(null);
  const hideTaskRef = useRef<number | null>(null);

  function clearScheduledTasks() {
    if (startTaskRef.current !== null) {
      window.clearTimeout(startTaskRef.current);
      startTaskRef.current = null;
    }

    if (hideTaskRef.current !== null) {
      window.clearTimeout(hideTaskRef.current);
      hideTaskRef.current = null;
    }
  }

  function setVisibilitySafely(nextValue: boolean) {
    if (!isMountedRef.current) {
      return;
    }

    setIsVisible(nextValue);
  }

  function setProgressSafely(nextValue: SetStateAction<number>) {
    if (!isMountedRef.current) {
      return;
    }

    setProgress(nextValue);
  }

  function scheduleTask(timerRef: MutableRefObject<number | null>, callback: () => void) {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (!isMountedRef.current) {
        return;
      }

      callback();
    }, 0);
  }

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      reducedMotionRef.current = mediaQuery.matches;
    };

    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);
    return () => mediaQuery.removeEventListener("change", updateReducedMotion);
  }, []);

  useEffect(() => {
    function clearTimers() {
      clearScheduledTasks();

      if (trickleTimerRef.current !== null) {
        window.clearInterval(trickleTimerRef.current);
        trickleTimerRef.current = null;
      }

      if (completeTimerRef.current !== null) {
        window.clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }

      if (failsafeTimerRef.current !== null) {
        window.clearTimeout(failsafeTimerRef.current);
        failsafeTimerRef.current = null;
      }
    }

    function finish() {
      if (!isActiveRef.current) {
        return;
      }

      isActiveRef.current = false;
      clearTimers();
      setProgressSafely(1);

      scheduleTask(hideTaskRef, () => {
        completeTimerRef.current = window.setTimeout(() => {
          completeTimerRef.current = null;
          setVisibilitySafely(false);
          setProgressSafely(0);
        }, COMPLETE_HIDE_DELAY_MS);
      });
    }

    function requestStart() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      clearTimers();
      isActiveRef.current = true;

      scheduleTask(startTaskRef, () => {
        setVisibilitySafely(true);
        setProgressSafely(reducedMotionRef.current ? REDUCED_MOTION_PROGRESS : INITIAL_PROGRESS);

        if (!reducedMotionRef.current) {
          trickleTimerRef.current = window.setInterval(() => {
            setProgressSafely((current) => {
              if (!isActiveRef.current || current >= 0.9) {
                return current;
              }

              return Math.min(current + (1 - current) * 0.14, 0.9);
            });
          }, TRICKLE_INTERVAL_MS);
        }

        failsafeTimerRef.current = window.setTimeout(() => {
          finish();
        }, FAILSAFE_TIMEOUT_MS);
      });
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel")?.includes("external")
      ) {
        return;
      }

      try {
        const url = new URL(anchor.href, window.location.href);

        if (shouldStartForUrl(url)) {
          requestStart();
        }
      } catch {
        // Ignore malformed href values.
      }
    };

    const handlePopState = () => {
      requestStart();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        finish();
      }
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const wrapHistoryMethod = (method: typeof window.history.pushState) =>
      function patchedHistoryMethod(this: History, data: unknown, unused: string, url?: string | URL | null) {
        if (url) {
          try {
            const nextUrl = new URL(String(url), window.location.href);

            if (shouldStartForUrl(nextUrl)) {
              requestStart();
            }
          } catch {
            // Ignore malformed history targets.
          }
        }

        return method.call(this, data, unused, url);
      };

    window.history.pushState = wrapHistoryMethod(originalPushState);
    window.history.replaceState = wrapHistoryMethod(originalReplaceState);

    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("popstate", handlePopState);

    return () => {
      clearTimers();
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!isActiveRef.current) {
      return;
    }

    setProgressSafely((current) => (current < 0.94 ? 0.94 : current));

    if (completeTimerRef.current !== null) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }

    completeTimerRef.current = window.setTimeout(() => {
      isActiveRef.current = false;
      if (trickleTimerRef.current !== null) {
        window.clearInterval(trickleTimerRef.current);
        trickleTimerRef.current = null;
      }
      if (failsafeTimerRef.current !== null) {
        window.clearTimeout(failsafeTimerRef.current);
        failsafeTimerRef.current = null;
      }

      setProgressSafely(1);

      scheduleTask(hideTaskRef, () => {
        completeTimerRef.current = window.setTimeout(() => {
          completeTimerRef.current = null;
          setVisibilitySafely(false);
          setProgressSafely(0);
        }, COMPLETE_HIDE_DELAY_MS);
      });
    }, 0);
  }, [pathname, searchParams]);

  return (
    <div className="br-top-loading-bar" data-visible={isVisible ? "true" : "false"} aria-hidden="true">
      <span className="br-top-loading-bar__progress" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
