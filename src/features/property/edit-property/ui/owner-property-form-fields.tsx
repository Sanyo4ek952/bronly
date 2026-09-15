import type { OwnerPropertyDetail } from "@/entities/property";
import { cn } from "@/shared/lib/cn";
import { FormSection, Input, Textarea } from "@/shared/ui";

type OwnerPropertyFormFieldsProps = {
  property?: OwnerPropertyDetail | null;
};

function renderChecked(value: boolean | undefined) {
  return value ? { defaultChecked: true } : {};
}

const propertyFormGridClass = "grid gap-4 md:grid-cols-2";
const inlineFieldsClass = "grid gap-4 md:grid-cols-2";
const stackClass = "grid gap-4";
const compactStackClass = "grid gap-3";
const twoColumnTextareasClass = "grid gap-4 md:grid-cols-2";
const toggleListClass = "grid gap-3";
const toggleRowClass = cn(
  "flex min-h-14 items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-[14px] text-sm text-[var(--color-text)]",
  "max-[640px]:min-h-[52px]",
);

export function OwnerPropertyFormFields({ property }: OwnerPropertyFormFieldsProps) {
  return (
    <div className={stackClass}>
      <FormSection
        id="overview"
        title="Основные данные"
        description="Название, тип объекта, адрес и описания, которые видит владелец и гость."
        variant="accordion"
      >
        <div className={propertyFormGridClass}>
          <Input id="property-title" name="title" label="Название объекта" defaultValue={property?.title ?? ""} />
          <Input id="property-type" name="propertyType" label="Тип объекта" defaultValue={property?.propertyType ?? ""} />
          <Input id="property-city" name="city" label="Город" defaultValue={property?.city ?? ""} />
          <Input
            id="property-address"
            name="address"
            label="Адрес"
            defaultValue={property?.address ?? ""}
            wrapperClassName="grid gap-1.5 md:col-span-2"
          />
        </div>

        <div className={compactStackClass}>
          <Textarea
            id="property-short-description"
            name="shortDescription"
            label="Краткое описание"
            defaultValue={property?.shortDescription ?? ""}
          />
          <Textarea
            id="property-full-description"
            name="fullDescription"
            label="Подробное описание"
            defaultValue={property?.fullDescription ?? ""}
            className="min-h-[170px]"
          />
        </div>
      </FormSection>

      <FormSection
        id="contacts"
        title="Контакты"
        description="Каналы связи владельца для быстрой связи и публичной страницы."
        variant="accordion"
      >
        <div className={inlineFieldsClass}>
          <Input id="property-phone" name="phone" label="Телефон" defaultValue={property?.phone ?? ""} />
          <Input id="property-telegram" name="telegram" label="Telegram" defaultValue={property?.telegram ?? ""} />
        </div>
      </FormSection>

      <FormSection
        id="rules"
        title="Правила и особенности"
        description="Время заезда, выезда, особенности объекта и правила проживания."
        variant="accordion"
      >
        <div className={inlineFieldsClass}>
          <Input id="property-check-in" name="checkInTime" label="Заезд" defaultValue={property?.checkInTime ?? ""} />
          <Input id="property-check-out" name="checkOutTime" label="Выезд" defaultValue={property?.checkOutTime ?? ""} />
        </div>

        <div className={twoColumnTextareasClass}>
          <Textarea
            id="property-features"
            name="features"
            label="Особенности объекта"
            defaultValue={property?.features.join("\n") ?? ""}
          />
          <Textarea
            id="property-rules"
            name="houseRules"
            label="Правила проживания"
            defaultValue={property?.houseRules.join("\n") ?? ""}
          />
        </div>
      </FormSection>

      <FormSection
        id="contacts-visibility"
        title="Публикация"
        description="Настройки видимости объекта и условий сотрудничества с агентами."
        variant="accordion"
      >
        <div className={toggleListClass}>
          <label className={toggleRowClass}>
            <span className="max-w-[calc(100%-42px)]">Показывать объект в публичной ссылке</span>
            <input type="checkbox" name="published" {...renderChecked(property?.published ?? true)} />
          </label>
          <label className={toggleRowClass}>
            <span className="max-w-[calc(100%-42px)]">Заморозить объект</span>
            <input type="checkbox" name="isFrozen" {...renderChecked(property?.isFrozen)} />
          </label>
          <label className={toggleRowClass}>
            <span className="max-w-[calc(100%-42px)]">Готов сотрудничать с агентами</span>
            <input type="checkbox" name="allowAgentInquiries" {...renderChecked(property?.allowAgentInquiries)} />
          </label>
          <label className={toggleRowClass}>
            <span className="max-w-[calc(100%-42px)]">Показывать контакты владельца агенту</span>
            <input
              type="checkbox"
              name="allowOwnerContactSharing"
              {...renderChecked(property?.allowOwnerContactSharing)}
            />
          </label>
        </div>
      </FormSection>
    </div>
  );
}
