import type { OwnerPropertyDetail } from "@/entities/property";
import { Input, Textarea } from "@/shared/ui";
import { FormSectionAccordion } from "@/widgets/property-admin";

type OwnerPropertyFormFieldsProps = {
  property?: OwnerPropertyDetail | null;
};

function renderChecked(value: boolean | undefined) {
  return value ? { defaultChecked: true } : {};
}

export function OwnerPropertyFormFields({ property }: OwnerPropertyFormFieldsProps) {
  return (
    <div className="br-owner-stack">
      <FormSectionAccordion
        id="overview"
        title="Основные данные"
        description="Название, тип объекта, адрес и описания, которые видит владелец и гость."
      >
        <div className="br-property-form__grid">
          <Input id="property-title" name="title" label="Название объекта" defaultValue={property?.title ?? ""} />
          <Input id="property-type" name="propertyType" label="Тип объекта" defaultValue={property?.propertyType ?? ""} />
          <Input id="property-city" name="city" label="Город" defaultValue={property?.city ?? ""} />
          <Input
            id="property-address"
            name="address"
            label="Адрес"
            defaultValue={property?.address ?? ""}
            wrapperClassName="br-form-field--span-2"
          />
        </div>

        <div className="br-owner-stack br-owner-stack--compact">
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
            className="br-textarea--lg"
          />
        </div>
      </FormSectionAccordion>

      <FormSectionAccordion
        id="contacts"
        title="Контакты"
        description="Каналы связи владельца для быстрой связи и публичной страницы."
      >
        <div className="br-inline-fields">
          <Input id="property-phone" name="phone" label="Телефон" defaultValue={property?.phone ?? ""} />
          <Input id="property-telegram" name="telegram" label="Telegram" defaultValue={property?.telegram ?? ""} />
        </div>
      </FormSectionAccordion>

      <FormSectionAccordion
        id="rules"
        title="Правила и особенности"
        description="Время заезда, выезда, особенности объекта и правила проживания."
      >
        <div className="br-inline-fields">
          <Input id="property-check-in" name="checkInTime" label="Заезд" defaultValue={property?.checkInTime ?? ""} />
          <Input id="property-check-out" name="checkOutTime" label="Выезд" defaultValue={property?.checkOutTime ?? ""} />
        </div>

        <div className="br-owner-grid-2">
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
      </FormSectionAccordion>

      <FormSectionAccordion
        id="contacts-visibility"
        title="Публикация"
        description="Настройки видимости объекта и условий сотрудничества с агентами."
      >
        <div className="br-toggle-list">
          <label className="br-toggle">
            <span>Показывать объект в публичной ссылке</span>
            <input type="checkbox" name="published" {...renderChecked(property?.published ?? true)} />
          </label>
          <label className="br-toggle">
            <span>Заморозить объект</span>
            <input type="checkbox" name="isFrozen" {...renderChecked(property?.isFrozen)} />
          </label>
          <label className="br-toggle">
            <span>Готов сотрудничать с агентами</span>
            <input type="checkbox" name="allowAgentInquiries" {...renderChecked(property?.allowAgentInquiries)} />
          </label>
          <label className="br-toggle">
            <span>Показывать контакты владельца агенту</span>
            <input
              type="checkbox"
              name="allowOwnerContactSharing"
              {...renderChecked(property?.allowOwnerContactSharing)}
            />
          </label>
        </div>
      </FormSectionAccordion>
    </div>
  );
}
