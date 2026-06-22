import type { ReactNode } from "react";

import { Input } from "@/shared/ui";
import { FormSection } from "@/shared/ui/form-section";

import { RoomAmenitiesField } from "@/features/property/edit-room/ui/room-amenities-field";

type RoomSectionProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

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
      <div className="br-property-form__grid">
        <Input id="room-title-new" name="title" label="Название номера" defaultValue={values?.title ?? ""} />
        {standalone ? (
          <>
            <Input id="room-city-new" name="city" label="Город" defaultValue={values?.city ?? ""} />
            <Input
              id="room-address-new"
              name="address"
              label="Адрес"
              defaultValue={values?.address ?? ""}
              wrapperClassName="br-form-field--span-2"
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
      <div className="br-property-form__grid br-room-form__grid--compact">
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

export function RoomPublishSettings({
  title,
  description,
  allowAgentControls = false,
  values,
  children,
}: RoomSectionProps & {
  allowAgentControls?: boolean;
  values?: {
    isActive?: boolean;
    allowAgentInquiries?: boolean;
    allowOwnerContactSharing?: boolean;
  };
}) {
  return (
    <FormSection variant="plain" title={title} description={description}>
      <div className="br-toggle-list br-room-form__toggles">
        <label className="br-toggle">
          <span>Номер активен</span>
          <input type="checkbox" name="isActive" defaultChecked={values?.isActive ?? true} />
        </label>
        {allowAgentControls ? (
          <>
            <label className="br-toggle">
              <span>Готов сотрудничать с агентами</span>
              <input type="checkbox" name="allowAgentInquiries" defaultChecked={values?.allowAgentInquiries ?? false} />
            </label>
            <label className="br-toggle">
              <span>Показывать контакты владельца агенту</span>
              <input
                type="checkbox"
                name="allowOwnerContactSharing"
                defaultChecked={values?.allowOwnerContactSharing ?? false}
              />
            </label>
          </>
        ) : null}
      </div>
      {children}
    </FormSection>
  );
}
