"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui";

export type PropertyGalleryItem = {
  id: string;
  url: string;
  alt: string;
  label: string;
};

type PropertyGalleryProps = {
  items: PropertyGalleryItem[];
};

export function PropertyGallery({ items }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex] ?? null;
  const hasControls = items.length > 1;

  const handlePrev = () => {
    setActiveIndex((current) => (current === 0 ? items.length - 1 : current - 1));
  };

  const handleNext = () => {
    setActiveIndex((current) => (current === items.length - 1 ? 0 : current + 1));
  };

  if (!activeItem) {
    return null;
  }

  return (
    <div className="br-room-photo-carousel br-property-gallery">
      <Image
        src={activeItem.url}
        alt={activeItem.alt}
        width={1600}
        height={960}
        unoptimized
        className="br-room-page-hero__image"
      />

      <div className="br-property-gallery__caption">
        <span>{activeItem.label}</span>
      </div>

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
            {items.map((item, index) => (
              <button
                key={item.id}
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
