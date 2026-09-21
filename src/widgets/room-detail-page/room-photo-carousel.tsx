"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";

import type { RoomPhoto } from "@/entities/room";
import { cn } from "@/shared/lib/cn";
import { AppIcon, IconButton } from "@/shared/ui";

type RoomPhotoCarouselProps = {
  photos: RoomPhoto[];
  roomTitle: string;
  variant?: "default" | "public";
};

const controlClass =
  "group absolute inset-y-0 z-[2] w-11 border-0 bg-transparent p-0 text-[var(--color-text)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]";

const controlHighlightClass = "pointer-events-none absolute inset-y-0 flex w-4 items-center justify-center bg-[rgb(255_255_255_/_0.28)] opacity-0 transition-opacity duration-[180ms] group-hover:opacity-100 group-focus-visible:opacity-100 sm:w-5";

export function RoomPhotoCarousel({ photos, roomTitle, variant = "default" }: RoomPhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const gesture = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const photoCount = photos.length;
  const displayedIndex = photoCount ? activeIndex % photoCount : 0;
  const activePhoto = photos[displayedIndex] ?? null;
  const hasControls = photoCount > 1;

  useEffect(() => {
    if (!hasControls || !isPlaying || isFullscreen) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActiveIndex((current) => (current + 1) % photoCount);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [activeIndex, hasControls, isPlaying, isFullscreen, photoCount]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isFullscreen || !dialog) return;
    const launcher = launcherRef.current;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      launcher?.focus({ preventScroll: true });
    };
  }, [isFullscreen]);

  const handlePrev = () => {
    setActiveIndex((current) => (current + photoCount - 1) % photoCount);
  };

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % photoCount);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    if (!hasControls || !event.isPrimary || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-carousel-action]")) return;
    gesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    target.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;
    suppressClick.current = true;
    if (deltaX < 0) handleNext();
    else handlePrev();
  };

  const gestureHandlers = {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: () => { gesture.current = null; },
    onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
      if (suppressClick.current && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
      }
    },
  };

  if (!activePhoto) {
    if (variant === "default") {
      return <div className="min-h-[280px] w-full rounded-[22px] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.10),rgb(17_29_27_/_0.08)),linear-gradient(135deg,#b8dbe2_0%,#88bdd0_45%,#d6e3d5_78%,#cab69d_100%)]" aria-hidden="true" />;
    }
    return (
      <div
        className="flex aspect-[4/3] w-full items-center justify-center rounded-[22px] bg-[var(--surface-subtle)] text-sm text-[var(--text-muted)] sm:aspect-[16/7]"
      >Фото пока нет</div>
    );
  }

  return (
    <>
    <div
      className={cn("relative touch-pan-y touch-pinch-zoom select-none overflow-hidden rounded-[22px]", variant === "public" ? "aspect-[4/3] bg-[var(--surface-subtle)] sm:aspect-[16/7]" : "min-h-[280px] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.10),rgb(17_29_27_/_0.08)),linear-gradient(135deg,#b8dbe2_0%,#88bdd0_45%,#d6e3d5_78%,#cab69d_100%)]")}
      role="region"
      aria-roledescription="карусель"
      aria-label={`Фотографии: ${roomTitle}`}
      {...gestureHandlers}
    >
      <Image
        src={activePhoto.url}
        alt={`${roomTitle} - фото ${displayedIndex + 1}`}
        width={1600}
        height={960}
        unoptimized
        draggable={false}
        className="h-full w-full object-cover"
      />

      <button
        ref={launcherRef}
        type="button"
        aria-label={`Открыть фото на весь экран: ${roomTitle}`}
        aria-haspopup="dialog"
        className="absolute inset-0 z-[1] !cursor-zoom-in border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]"
        onClick={() => setIsFullscreen(true)}
      />

      {hasControls ? (
        <>
          <button
            type="button"
            aria-label="Предыдущее фото"
            className={cn(controlClass, "left-0")}
            onClick={handlePrev}
          >
            <span className={cn(controlHighlightClass, "left-0")} aria-hidden="true">
              <AppIcon icon={ChevronLeft} className="text-base" />
            </span>
          </button>
          <button
            type="button"
            aria-label="Следующее фото"
            className={cn(controlClass, "right-0")}
            onClick={handleNext}
          >
            <span className={cn(controlHighlightClass, "right-0")} aria-hidden="true">
              <AppIcon icon={ChevronRight} className="text-base" />
            </span>
          </button>
          <IconButton
            data-carousel-action
            aria-label={isPlaying ? "Приостановить смену фото" : "Продолжить смену фото"}
            className="absolute right-3 top-3 z-[3]"
            onClick={() => setIsPlaying((current) => !current)}
          >
            <AppIcon icon={isPlaying ? Pause : Play} />
          </IconButton>

          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[3] flex flex-wrap justify-center gap-2" aria-label="Навигация по фото">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                data-carousel-action
                className={cn(
                  "pointer-events-auto h-2.5 w-2.5 rounded-full border border-[rgb(255_255_255_/_0.52)] bg-[rgb(255_255_255_/_0.48)] transition-[transform,background-color,border-color] duration-[180ms]",
                  index === displayedIndex && "scale-110 border-white bg-white",
                )}
                aria-label={`Открыть фото ${index + 1}`}
                aria-pressed={index === displayedIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
    <dialog
      ref={dialogRef}
      aria-label={`Фотографии на весь экран: ${roomTitle}`}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-[var(--color-text)] p-0 text-white backdrop:bg-[var(--color-text)]"
      onCancel={() => setIsFullscreen(false)}
      onClose={() => setIsFullscreen(false)}
      onKeyDown={(event) => {
        if (!hasControls) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          if (event.key === "ArrowLeft") handlePrev();
          else handleNext();
        }
      }}
    >
      {isFullscreen ? <>
        <div className="absolute inset-x-0 top-0 z-[3] flex items-center justify-between gap-4 bg-[rgb(0_0_0_/_0.35)] px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <span className="min-w-0 truncate text-sm" aria-live="polite">{roomTitle} · {displayedIndex + 1} / {photoCount}</span>
          <IconButton aria-label="Закрыть просмотр фото" onClick={() => setIsFullscreen(false)} className="shrink-0">
            <AppIcon icon={X} />
          </IconButton>
        </div>
        <div className="relative h-full w-full touch-pan-y touch-pinch-zoom select-none" {...gestureHandlers}>
          <Image
            src={activePhoto.url}
            alt={`${roomTitle} - фото ${displayedIndex + 1}`}
            fill
            unoptimized
            draggable={false}
            className="object-contain"
          />
          {hasControls ? <>
            <button type="button" aria-label="Предыдущее фото" className={cn(controlClass, "left-0 !text-white")} onClick={handlePrev}>
              <span className={cn(controlHighlightClass, "left-0 !opacity-100")} aria-hidden="true"><AppIcon icon={ChevronLeft} className="text-base" /></span>
            </button>
            <button type="button" aria-label="Следующее фото" className={cn(controlClass, "right-0 !text-white")} onClick={handleNext}>
              <span className={cn(controlHighlightClass, "right-0 !opacity-100")} aria-hidden="true"><AppIcon icon={ChevronRight} className="text-base" /></span>
            </button>
          </> : null}
        </div>
      </> : null}
    </dialog>
    </>
  );
}
