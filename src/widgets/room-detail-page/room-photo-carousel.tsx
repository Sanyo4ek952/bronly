"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { RoomPhoto } from "@/entities/room";
import { Button } from "@/shared/ui";

type RoomPhotoCarouselProps = {
  photos: RoomPhoto[];
  roomTitle: string;
};

export function RoomPhotoCarousel({ photos, roomTitle }: RoomPhotoCarouselProps) {
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
    return <div className="br-room-page-hero__placeholder" aria-hidden="true" />;
  }

  return (
    <div className="br-room-photo-carousel">
      <Image
        src={activePhoto.url}
        alt={`${roomTitle} — фото ${activeIndex + 1}`}
        width={1600}
        height={960}
        unoptimized
        className="br-room-page-hero__image"
      />

      {hasControls ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="br-room-photo-carousel__control br-room-photo-carousel__control--prev"
            onClick={handlePrev}
            aria-label="Предыдущее фото"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="br-room-photo-carousel__control br-room-photo-carousel__control--next"
            onClick={handleNext}
            aria-label="Следующее фото"
          >
            <ChevronRight aria-hidden="true" />
          </Button>

          <div className="br-room-photo-carousel__dots" aria-label="Навигация по фото">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                className={`br-room-photo-carousel__dot${index === activeIndex ? " br-room-photo-carousel__dot--active" : ""}`}
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
