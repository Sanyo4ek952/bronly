"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { AppIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";

const CLOSE_DURATION_MS = 220;
const DRAG_CLOSE_RATIO = 0.25;
const DRAG_CLOSE_VELOCITY = 0.6;

export type BottomSheetRenderApi = {
  close: () => void;
};

export type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  closeLabel: string;
  dialogId?: string;
  titleId?: string;
  className?: string;
  rootClassName?: string;
  bodyClassName?: string;
  desktopSidePanel?: boolean;
  children: ReactNode | ((api: BottomSheetRenderApi) => ReactNode);
};

type SheetPhase = "closed" | "opening" | "open" | "closing";

type DragState = {
  pointerId: number | null;
  startY: number;
  startTime: number;
  started: boolean;
};

function isInteractiveElement(target: EventTarget | null) {
  return target instanceof HTMLElement
    && Boolean(target.closest("a, button, input, textarea, select, option, label, summary, [role='button'], [role='combobox'], [role='listbox'], [role='option']"));
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  dialogId,
  titleId,
  className,
  rootClassName,
  bodyClassName,
  desktopSidePanel = false,
  children,
}: BottomSheetProps) {
  const generatedDialogId = useId();
  const generatedTitleId = useId();
  const generatedDescriptionId = useId();
  const resolvedDialogId = dialogId ?? `sheet-${generatedDialogId}`;
  const resolvedTitleId = titleId ?? `sheet-title-${generatedTitleId}`;
  const resolvedDescriptionId = description ? `sheet-description-${generatedDescriptionId}` : undefined;
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState>({
    pointerId: null,
    startY: 0,
    startTime: 0,
    started: false,
  });
  const closeTimerRef = useRef<number | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState<SheetPhase>(open ? "open" : "closed");
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [closeStartOffset, setCloseStartOffset] = useState(0);
  const isRendered = open || phase !== "closed";

  useEffect(() => {
    let frameId: number | null = null;
    let openFrameId: number | null = null;

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      frameId = window.requestAnimationFrame(() => {
        setPhase("opening");
        openFrameId = window.requestAnimationFrame(() => {
          setPhase("open");
        });
      });

      return () => {
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
        }

        if (openFrameId !== null) {
          window.cancelAnimationFrame(openFrameId);
        }
      };
    }

    if (!isRendered) {
      return undefined;
    }

    frameId = window.requestAnimationFrame(() => {
      setPhase("closing");
      closeTimerRef.current = window.setTimeout(() => {
        setPhase("closed");
        setDragOffset(0);
        setIsDragging(false);
        setIsSettling(false);
        setCloseStartOffset(0);
        closeTimerRef.current = null;
      }, CLOSE_DURATION_MS);
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open, isRendered]);

  useEffect(() => {
    if (!isRendered) {
      return undefined;
    }

    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    return () => {
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [isRendered]);

  useEffect(() => {
    if (phase !== "open") {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      const firstFocusable = sheetRef.current?.querySelector<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );

      (firstFocusable ?? sheetRef.current)?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [phase]);

  useEffect(() => {
    if (!isRendered) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isRendered]);

  useEffect(() => {
    if (!isRendered) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (event.target instanceof HTMLElement && event.target.closest("[role='listbox']")) {
          return;
        }

        setCloseStartOffset(0);
        onOpenChange(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const sheet = sheetRef.current;
      if (!sheet) {
        return;
      }

      const focusable = Array.from(sheet.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ));

      if (focusable.length === 0) {
        event.preventDefault();
        sheet.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRendered, onOpenChange]);

  const close = () => {
    setCloseStartOffset(0);
    onOpenChange(false);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (phase !== "open") {
      return;
    }

    if (desktopSidePanel && window.matchMedia("(min-width: 768px)").matches) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (isInteractiveElement(event.target)) {
      return;
    }

    const body = bodyRef.current;
    if (body && body.contains(event.target as Node) && body.scrollTop > 0) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTime: Date.now(),
      started: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsSettling(false);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    const nextOffset = Math.max(0, event.clientY - dragState.startY);
    if (!dragState.started && nextOffset < 6) {
      return;
    }

    dragState.started = true;
    setIsDragging(true);
    setDragOffset(nextOffset);
  };

  const resetDrag = () => {
    dragStateRef.current = {
      pointerId: null,
      startY: 0,
      startTime: 0,
      started: false,
    };
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const finalOffset = dragOffset;
    const elapsed = Math.max(Date.now() - dragState.startTime, 1);
    const velocity = finalOffset / elapsed;
    const sheetHeight = sheetRef.current?.offsetHeight ?? 0;
    const shouldClose = dragState.started
      && (finalOffset >= sheetHeight * DRAG_CLOSE_RATIO || velocity >= DRAG_CLOSE_VELOCITY);

    resetDrag();

    if (shouldClose) {
      setIsDragging(false);
      setIsSettling(false);
      setDragOffset(0);
      setCloseStartOffset(finalOffset);
      onOpenChange(false);
      return;
    }

    setIsDragging(false);
    setIsSettling(dragState.started);
    setDragOffset(0);
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resetDrag();
    setIsDragging(false);
    setIsSettling(dragState.started);
    setDragOffset(0);
  };

  if (!isRendered) {
    return null;
  }

  const content = typeof children === "function" ? children({ close }) : children;
  const sheetStyle = isDragging || isSettling
    ? { transform: `translateY(${dragOffset}px)` }
    : { ["--sheet-close-start" as string]: `${closeStartOffset}px` };

  return (
    <div
      className={cn(
        "group fixed inset-0 z-40 flex items-end justify-stretch bg-[rgb(15_23_42_/_0.28)] pt-6 backdrop-blur-xl",
        "data-[state=opening]:animate-[sheet-fade-in_220ms_ease_forwards] data-[state=open]:animate-[sheet-fade-in_220ms_ease_forwards]",
        "data-[state=closing]:animate-[sheet-fade-out_220ms_ease_forwards]",
        rootClassName,
      )}
      data-state={phase}
      role="presentation"
      onClick={close}
    >
      <section
        id={resolvedDialogId}
        ref={sheetRef}
        className={cn(
          "mt-auto grid max-h-[min(82vh,720px)] w-full translate-y-[calc(100%+24px)] touch-pan-x gap-3.5 overflow-hidden rounded-t-[22px] border border-[var(--border)] bg-[var(--surface)] p-3.5 pb-[calc(14px+var(--safe-area-bottom))] shadow-[var(--shadow-lg)]",
          "group-data-[state=opening]:animate-[sheet-enter_220ms_ease_forwards] group-data-[state=open]:translate-y-0 group-data-[state=closing]:animate-[sheet-close_220ms_ease_forwards]",
          "max-[390px]:rounded-t-[20px] max-[390px]:p-3 max-[390px]:pb-[calc(12px+var(--safe-area-bottom))]",
          "max-[360px]:rounded-t-[18px] max-[360px]:p-2.5 max-[360px]:pb-[calc(10px+var(--safe-area-bottom))]",
          desktopSidePanel && "md:grid-rows-[auto_minmax(0,1fr)] md:content-start md:touch-auto",
          isDragging && "transition-none",
          isSettling && "transition-transform duration-200 ease-out",
          className,
        )}
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        aria-describedby={resolvedDescriptionId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onTransitionEnd={() => {
          if (isSettling) {
            setIsSettling(false);
          }
        }}
      >
        <div className="grid gap-3.5">
          <div className={cn("mx-auto h-[5px] w-[52px] rounded-full bg-[rgb(17_29_27_/_0.14)]", desktopSidePanel && "md:hidden")} aria-hidden="true" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={resolvedTitleId} className="text-xl font-bold leading-[1.1] text-[var(--text)]">{title}</h2>
              {description ? <p id={resolvedDescriptionId} className="mt-1.5 text-sm leading-[1.5] text-[var(--text-muted)]">{description}</p> : null}
            </div>
            <IconButton
              type="button"
              className="shrink-0"
              aria-label={closeLabel}
              onClick={close}
            >
              <AppIcon icon={X} aria-hidden="true" />
            </IconButton>
          </div>
        </div>

        <div ref={bodyRef} className={cn("grid gap-2.5 overflow-auto pr-0.5", desktopSidePanel && "md:content-start", bodyClassName)}>
          {content}
        </div>
      </section>
    </div>
  );
}
