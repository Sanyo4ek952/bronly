"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { AppIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";

const CLOSE_DURATION_MS = 220;
const DRAG_CLOSE_RATIO = 0.25;
const DRAG_CLOSE_VELOCITY = 0.6;

type BottomSheetRenderApi = {
  close: () => void;
};

type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  closeLabel: string;
  dialogId?: string;
  titleId?: string;
  className?: string;
  bodyClassName?: string;
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
    && Boolean(target.closest("a, button, input, textarea, select, option, label, summary, [role='button']"));
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
  bodyClassName,
  children,
}: BottomSheetProps) {
  const generatedDialogId = useId();
  const generatedTitleId = useId();
  const resolvedDialogId = dialogId ?? `sheet-${generatedDialogId}`;
  const resolvedTitleId = titleId ?? `sheet-title-${generatedTitleId}`;
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState>({
    pointerId: null,
    startY: 0,
    startTime: 0,
    started: false,
  });
  const closeTimerRef = useRef<number | null>(null);
  const [isRendered, setIsRendered] = useState(open);
  const [phase, setPhase] = useState<SheetPhase>(open ? "open" : "closed");
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [closeStartOffset, setCloseStartOffset] = useState(0);

  useEffect(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      setIsRendered(true);
      setPhase("opening");

      const frameId = window.requestAnimationFrame(() => {
        setPhase("open");
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    if (!isRendered) {
      setPhase("closed");
      return undefined;
    }

    setPhase("closing");
    closeTimerRef.current = window.setTimeout(() => {
      setIsRendered(false);
      setPhase("closed");
      setDragOffset(0);
      setIsDragging(false);
      setIsSettling(false);
      setCloseStartOffset(0);
      closeTimerRef.current = null;
    }, CLOSE_DURATION_MS);

    return () => {
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
    : { ["--br-sheet-close-start" as string]: `${closeStartOffset}px` };

  return (
    <div
      className="br-bottom-sheet-backdrop"
      data-state={phase}
      role="presentation"
      onClick={close}
    >
      <section
        id={resolvedDialogId}
        ref={sheetRef}
        className={cn(
          "br-bottom-sheet br-card",
          isDragging && "br-bottom-sheet--dragging",
          isSettling && "br-bottom-sheet--settling",
          className,
        )}
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
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
        <div className="br-bottom-sheet__gesture-zone">
          <div className="br-bottom-sheet__handle" aria-hidden="true" />

          <div className="br-bottom-sheet__header">
            <div>
              <h2 id={resolvedTitleId}>{title}</h2>
              {description ? <p>{description}</p> : null}
            </div>
            <IconButton
              type="button"
              className="br-bottom-sheet__close"
              aria-label={closeLabel}
              onClick={close}
            >
              <AppIcon icon={X} aria-hidden="true" />
            </IconButton>
          </div>
        </div>

        <div ref={bodyRef} className={cn("br-bottom-sheet__body", bodyClassName)}>
          {content}
        </div>
      </section>
    </div>
  );
}
