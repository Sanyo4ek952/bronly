import { createOwnerRoom } from "@/features/property/owner-mutations/room-actions";
import { RoomAgentSettings, RoomAmenitiesSection, RoomBaseFields, RoomPhotosField, RoomPricingFields } from "@/features/property/edit-room/ui/room-form-blocks";
import { RoomDateRangeField } from "@/features/property/edit-room/ui/room-date-range-field";
import { FormSection, InlineNotice, Input, Textarea } from "@/shared/ui";
import { CreationWizard } from "./setup-flow";

export function RoomCreationForm({ propertyId, disabled }: { propertyId?: string; disabled?: boolean }) {
  const standalone = !propertyId;
  return (
    <CreationWizard action={createOwnerRoom} disabled={disabled} submitLabel="Создать номер"
      cancelHref={propertyId ? `/dashboard/properties/${propertyId}/rooms` : "/dashboard/properties"}
      hiddenFields={propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : undefined}
      steps={[
        { title: "Основная информация", description: standalone ? "Укажите название и адрес вашего номера." : "Дайте номеру название, по которому гости смогут его узнать.", content: <RoomBaseFields bare title="Данные номера" description={standalone ? "Номер будет размещён отдельно от объектов." : "Адрес и контакты используются из объекта."} standalone={standalone} /> },
        { title: standalone ? "Удобства и описание" : "Удобства", description: "Расскажите гостям, что есть в номере.", content: <div className="grid gap-6 divide-y divide-[var(--border)] [&>section+section]:pt-6">
          <RoomAmenitiesSection bare title="Удобства номера" description="Отметьте доступные гостям удобства." amenities={[]} />
          {standalone ? <FormSection title="Описание" variant="bare"><Textarea id="room-short-description-new" name="shortDescription" label="Краткое описание" /><Textarea id="room-full-description-new" name="fullDescription" label="Подробное описание" /></FormSection> : null}
        </div> },
        { title: "Фотографии", description: "Покажите номер, спальные места и ванную комнату.", content: <RoomPhotosField bare title="Фото номера" description="Можно выбрать до 10 фото. Первое станет главным. Фото можно добавить и после создания номера." /> },
        { title: "Цена и условия", description: "Укажите вместимость и базовую цену за ночь, затем создайте номер.", content: <div className="grid gap-6 divide-y divide-[var(--border)] [&>section+section]:pt-6">
          <RoomPricingFields bare title="Вместимость и цена" description="Сезонные цены можно добавить после создания номера." />
          {standalone ? <>
            <FormSection title="Контакты и занятые даты" variant="bare"><div className="grid gap-6 divide-y divide-[var(--border)] [&>section+section]:pt-6"><div className="grid gap-4 sm:grid-cols-2"><Input id="room-phone-new" name="phone" label="Телефон" /><Input id="room-telegram-new" name="telegram" label="Telegram" /></div><RoomDateRangeField /></div></FormSection>
            <RoomAgentSettings bare title="Работа с агентами" description="Разрешите агентам присылать предложения о сотрудничестве." />
          </> : null}
          <InlineNotice tone="soft">После создания номер станет активным и займёт одно место в лимите. Он будет доступен на публичной странице, если её показ разрешён.</InlineNotice>
        </div> },
      ]}
    />
  );
}
