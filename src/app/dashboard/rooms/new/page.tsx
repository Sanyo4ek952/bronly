import Link from "next/link";

import { createOwnerRoom } from "@/app/dashboard/properties/actions";
import { getRoomCreateNotice } from "@/app/dashboard/properties/page-helpers";
import {
  RoomAmenitiesSection,
  RoomBaseFields,
  RoomPhotosField,
  RoomPricingFields,
  RoomPublishSettings,
} from "@/features/property/edit-room/ui/room-form-blocks";
import { RoomDateRangeField } from "@/features/property/edit-room/ui/room-date-range-field";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildOwnerInventoryBreadcrumbs, readSearchParams } from "@/shared/lib";
import { Button, DashboardPageNav, Input, Textarea } from "@/shared/ui";

type StandaloneRoomCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StandaloneRoomCreatePage({ searchParams }: StandaloneRoomCreatePageProps) {
  const params = await readSearchParams(searchParams);
  const error = typeof params.error === "string" ? params.error : "";
  const notice = getRoomCreateNotice(error);
  const profile = await getCurrentAuthProfile();

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: "Отдельные номера", href: "/dashboard/properties" },
          { label: "Новый номер" },
        ])}
        compact
      />

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
        <form action={createOwnerRoom} className="br-owner-stack br-room-form">
          <RoomBaseFields
            title="Основное"
            description="Как называется номер и где он находится."
            standalone
          />

          <RoomPricingFields
            title="Вместимость и цена"
            description="Ключевые параметры номера для карточки и заявки."
          />

          <section className="br-room-form__section">
            <div className="br-room-form__section-header">
              <h3>Описание</h3>
              <p>Короткий анонс и подробности для гостя.</p>
            </div>
            <div className="br-room-form__section-body br-owner-stack">
              <Textarea id="room-short-description-new" name="shortDescription" label="Краткое описание" />
              <Textarea id="room-full-description-new" name="fullDescription" label="Подробное описание" className="br-textarea--lg" />
            </div>
          </section>

          <RoomAmenitiesSection
            title="Удобства номера"
            description="Главное держим перед глазами, остальное раскрывается по тапу."
            amenities={[]}
          />

          <RoomPhotosField
            title="Фото номера"
            description="Можно выбрать до 10 фото сразу. Первое фото станет главным."
          />

          <section className="br-room-form__section">
            <div className="br-room-form__section-header">
              <h3>Контакты и занятые даты</h3>
              <p>Оставьте контакты и, если нужно, сразу отметьте занятый диапазон.</p>
            </div>
            <div className="br-room-form__section-body br-owner-stack">
              <div className="br-inline-fields">
                <Input id="room-phone-new" name="phone" label="Телефон" />
                <Input id="room-telegram-new" name="telegram" label="Telegram" />
              </div>
              <RoomDateRangeField />
            </div>
          </section>

          <RoomPublishSettings
            title="Настройки"
            description="Что показывать гостю и как вести номер в кабинете."
            allowAgentControls
          />

          <div className="br-active-step__actions br-room-form__actions">
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
