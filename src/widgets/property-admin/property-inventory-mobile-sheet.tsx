"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/shared/lib/cn";

const CLOSE_DURATION_MS = 220;
const DRAG_CLOSE_RATIO = 0.25;
const DRAG_CLOSE_VELOCITY = 0.6;

type PropertyInventoryMobileSheetRenderApi = {
  close: () => void;
};

type PropertyInventoryMobileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  closeLabel: string;
  children: ReactNode | ((api: PropertyInventoryMobileSheetRenderApi) => ReactNode);
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
    && Boolean(target.closest("a, button, input, textarea, select, option, label, summary, [role='button']"));
}

export function PropertyInventoryMobileSheet({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
}: PropertyInventoryMobileSheetProps) {
  const generatedDialogId = useId();
  const generatedTitleId = useId();
  const dialogId = `property-inventory-sheet-${generatedDialogId}`;
  const titleId = `property-inventory-sheet-title-${generatedTitleId}`;
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState>({
    pointerId: null,
    startY: 0,
    startTime: 0,
    started: false,
  });
  const closeTimerRef = useRef<number | null>(null);
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
        setCloseStartOffset(0);
        onOpenChange(false);
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
    : { ["--property-inventory-sheet-close-start" as string]: `${closeStartOffset}px` };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-[rgb(16_24_40_/_0.56)] backdrop-blur-[2px] transition-opacity duration-[220ms] min-[721px]:hidden",
        phase === "open" ? "opacity-100" : "opacity-0",
      )}
      role="presentation"
      onClick={close}
    >
      <section
        id={dialogId}
        ref={sheetRef}
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-[28px] border border-[rgb(var(--color-primary-rgb)_/_0.10)]",
          "bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_250_/_0.96))]",
          "px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 [box-shadow:var(--shadow-md)]",
          "transition-transform duration-[220ms]",
          isDragging && "transition-none",
          isSettling && "duration-[220ms]",
          phase === "open" ? "translate-y-0" : "translate-y-full",
        )}
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
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
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[rgb(16_24_40_/_0.12)]" aria-hidden="true" />

        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <h2 id={titleId} className="text-[22px] font-bold leading-[1.1] tracking-[-0.02em] text-[var(--text)]">
              {title}
            </h2>
            {description ? (
              <p className="max-w-[26rem] text-sm leading-[1.45] text-[var(--text-muted)]">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-[14px] border border-[var(--border)] bg-white text-[var(--text-subtle)] transition-[background-color,border-color,color,transform] duration-[180ms] hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)]"
            aria-label={closeLabel}
            onClick={close}
          >
            <X aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>

        <div ref={bodyRef} className="grid max-h-[70vh] gap-4 overflow-y-auto pb-1">
          {content}
        </div>
      </section>
    </div>
  );
}
