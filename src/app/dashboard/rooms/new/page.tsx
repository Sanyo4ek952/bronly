import Link from "next/link";

import { createOwnerRoom } from "@/app/dashboard/properties/actions";
import { getRoomCreateNotice } from "@/app/dashboard/properties/page-helpers";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { Button, Input, Textarea } from "@/shared/ui";

type StandaloneRoomCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StandaloneRoomCreatePage({ searchParams }: StandaloneRoomCreatePageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const notice = getRoomCreateNotice(error);
  const profile = await getCurrentAuthProfile();

  return (
    <section className="br-owner-stack">
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Новый отдельный номер</h2>
            <p>Создайте самостоятельный номер без объекта. Он попадет в общий список и в отдельный блок на публичной странице владельца.</p>
          </div>
        </div>
        {notice ? <div className="br-inline-notice">{notice}</div> : null}
        {profile ? <div className="br-owner-muted">Подписка учитывает этот номер в общем лимите активных номеров.</div> : null}
      </section>

      <section className="br-dashboard-block br-card">
        <form action={createOwnerRoom} className="br-owner-stack">
          <div className="br-property-form__grid">
            <Input id="room-title-new" name="title" label="Название номера" />
            <Input id="room-subtitle-new" name="subtitle" label="Подзаголовок" />
            <Input id="room-type-new" name="propertyType" label="Тип размещения" />
            <Input id="room-city-new" name="city" label="Город" />
            <Input id="room-timezone-new" name="timezone" label="Часовой пояс" defaultValue="(UTC+03:00) Москва" />
            <Input id="room-address-new" name="address" label="Адрес" wrapperClassName="br-form-field--span-2" />
            <Input id="room-capacity-new" name="capacity" type="number" min="1" label="Гостей" defaultValue="2" />
            <Input id="room-bedrooms-new" name="bedrooms" type="number" min="1" label="Спален" defaultValue="1" />
            <Input id="room-area-new" name="area" type="number" min="0" label="Площадь, м²" defaultValue="0" />
            <Input id="room-price-new" name="pricePerNight" type="number" min="0" step="0.01" label="Базовая цена за ночь" defaultValue="0" />
          </div>

          <Textarea id="room-short-description-new" name="shortDescription" label="Краткое описание" />
          <Textarea id="room-full-description-new" name="fullDescription" label="Подробное описание" className="br-textarea--lg" />
          <Textarea id="room-amenities-new" name="amenities" label="Удобства номера" />

          <div className="br-inline-fields">
            <Input id="room-phone-new" name="phone" label="Телефон" />
            <Input id="room-whatsapp-new" name="whatsapp" label="WhatsApp" />
            <Input id="room-telegram-new" name="telegram" label="Telegram" />
          </div>

          <div className="br-inline-fields">
            <Input id="room-check-in-new" name="checkInTime" label="Заезд" />
            <Input id="room-check-out-new" name="checkOutTime" label="Выезд" />
          </div>

          <div className="br-toggle-list">
            <label className="br-toggle">
              <span>Номер активен</span>
              <input type="checkbox" name="isActive" defaultChecked />
            </label>
            <label className="br-toggle">
              <span>Готов сотрудничать с агентами</span>
              <input type="checkbox" name="allowAgentInquiries" />
            </label>
            <label className="br-toggle">
              <span>Показывать контакты владельца агенту</span>
              <input type="checkbox" name="allowOwnerContactSharing" />
            </label>
          </div>

          <div className="br-active-step__actions">
            <Link href="/dashboard/properties" className="br-button br-button--secondary">
              К общему списку
            </Link>
            <Button type="submit">Создать номер</Button>
          </div>
        </form>
      </section>
    </section>
  );
}
