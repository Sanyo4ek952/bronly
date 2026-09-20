import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { Input } from "@/shared/ui";
import { FormSection } from "@/shared/ui/form-section";

import { RoomAmenitiesField } from "@/features/property/edit-room/ui/room-amenities-field";

type RoomSectionProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

const propertyFormGridClass = "grid gap-4 md:grid-cols-2";
const compactPricingGridClass = "grid gap-4 md:grid-cols-2 xl:grid-cols-4";
const toggleListClass = "grid gap-3";
const toggleRowClass = cn(
  "flex min-h-14 items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-[14px] text-sm text-[var(--color-text)]",
  "max-[640px]:min-h-[52px]",
);

export function RoomBaseFields({
  title,
  description,
  standalone = false,
  values,
}: RoomSectionProps & {
  standalone?: boolean;
  values?: {
    title?: string;
    city?: string;
    address?: string;
  };
}) {
  return (
    <FormSection variant="plain" title={title} description={description}>
      <div className={propertyFormGridClass}>
        <Input id="room-title-new" name="title" label="Название номера" defaultValue={values?.title ?? ""} />
        {standalone ? (
          <>
            <Input id="room-city-new" name="city" label="Город" defaultValue={values?.city ?? ""} />
            <Input
              id="room-address-new"
              name="address"
              label="Адрес"
              defaultValue={values?.address ?? ""}
              wrapperClassName="grid gap-1.5 md:col-span-2"
            />
          </>
        ) : null}
      </div>
    </FormSection>
  );
}

export function RoomPricingFields({
  title,
  description,
  values,
}: RoomSectionProps & {
  values?: {
    capacity?: string;
    bedrooms?: string;
    area?: string;
    pricePerNight?: string;
  };
}) {
  return (
    <FormSection variant="plain" title={title} description={description}>
      <div className={compactPricingGridClass}>
        <Input id="room-capacity-new" name="capacity" type="number" min="1" label="Гостей" defaultValue={values?.capacity ?? "2"} />
        <Input id="room-bedrooms-new" name="bedrooms" type="number" min="1" label="Спален" defaultValue={values?.bedrooms ?? "1"} />
        <Input id="room-area-new" name="area" type="number" min="0" label="Площадь, м2" defaultValue={values?.area ?? "0"} />
        <Input
          id="room-price-new"
          name="pricePerNight"
          type="number"
          min="0"
          step="0.01"
          label="Базовая цена за ночь"
          defaultValue={values?.pricePerNight ?? "0"}
        />
      </div>
    </FormSection>
  );
}

export function RoomAmenitiesSection({
  title,
  description,
  amenities,
}: RoomSectionProps & {
  amenities: string[];
}) {
  return (
    <FormSection variant="plain" title={title} description={description}>
      <RoomAmenitiesField initialAmenities={amenities} />
    </FormSection>
  );
}

export function RoomPhotosField({
  title,
  description,
}: RoomSectionProps) {
  return (
    <FormSection variant="plain" title={title} description={description}>
      <Input
        id="room-photos-new"
        name="photos"
        type="file"
        accept="image/*"
        multiple
        label="Фотографии номера"
        description="JPG, PNG, WebP или GIF, до 5 МБ каждое."
      />
    </FormSection>
  );
}

export function RoomAgentSettings({
  title,
  description,
  values,
  children,
}: RoomSectionProps & {
  values?: {
    allowAgentInquiries?: boolean;
  };
}) {
  return (
    <FormSection variant="plain" title={title} description={description}>
      <div className={toggleListClass}>
        <label className={toggleRowClass}>
          <span className="max-w-[calc(100%-42px)]">Хочу работать с агентами</span>
          <input type="checkbox" name="allowAgentInquiries" defaultChecked={values?.allowAgentInquiries ?? false} />
        </label>
      </div>
      {children}
    </FormSection>
  );
}
