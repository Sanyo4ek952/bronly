"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { RoomPhoto } from "@/entities/room";
import { cn } from "@/shared/lib/cn";
import { AppIcon, IconButton } from "@/shared/ui";

type RoomPhotoCarouselProps = {
  photos: RoomPhoto[];
  roomTitle: string;
  variant?: "default" | "public";
};

const controlClass =
  "absolute top-1/2 z-[2] -translate-y-1/2 border border-[rgb(255_255_255_/_0.58)] bg-[rgb(255_255_255_/_0.88)] text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur";

export function RoomPhotoCarousel({ photos, roomTitle, variant = "default" }: RoomPhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = photos[activeIndex] ?? null;
  const hasControls = photos.length > 1;

  const handlePrev = () => {
    setActiveIndex((current) => (current === 0 ? photos.length - 1 : current - 1));
  };

  const handleNext = () => {
    setActiveIndex((current) => (current === photos.length - 1 ? 0 : current + 1));
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
    <div className={cn("relative overflow-hidden rounded-[22px]", variant === "public" ? "aspect-[4/3] bg-[var(--surface-subtle)] sm:aspect-[16/7]" : "min-h-[280px] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.10),rgb(17_29_27_/_0.08)),linear-gradient(135deg,#b8dbe2_0%,#88bdd0_45%,#d6e3d5_78%,#cab69d_100%)]")}>
      <Image
        src={activePhoto.url}
        alt={`${roomTitle} - фото ${activeIndex + 1}`}
        width={1600}
        height={960}
        unoptimized
        className="h-full w-full object-cover"
      />

      {hasControls ? (
        <>
          <IconButton
            aria-label="Предыдущее фото"
            className={cn(controlClass, "left-4")}
            onClick={handlePrev}
          >
            <AppIcon icon={ChevronLeft} />
          </IconButton>
          <IconButton
            aria-label="Следующее фото"
            className={cn(controlClass, "right-4")}
            onClick={handleNext}
          >
            <AppIcon icon={ChevronRight} />
          </IconButton>

          <div className="absolute inset-x-4 bottom-4 z-[2] flex flex-wrap justify-center gap-2" aria-label="Навигация по фото">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                className={cn(
                  "h-2.5 w-2.5 rounded-full border border-[rgb(255_255_255_/_0.52)] bg-[rgb(255_255_255_/_0.48)] transition-[transform,background-color,border-color] duration-[180ms]",
                  index === activeIndex && "scale-110 border-white bg-white",
                )}
                aria-label={`Открыть фото ${index + 1}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
