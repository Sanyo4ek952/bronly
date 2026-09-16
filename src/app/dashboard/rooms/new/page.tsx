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
import { RoomFormSection } from "@/features/property/edit-room/ui/room-form-section";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildOwnerInventoryBreadcrumbs, readSearchParams } from "@/shared/lib";
import { Button, ButtonLink, DashboardPageNav, InlineNotice, Input, Panel, Textarea } from "@/shared/ui";
import { AdminPageHeader } from "@/widgets/property-admin";

type StandaloneRoomCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid min-w-0 gap-6 max-[720px]:gap-5";
const formStackClass = "grid min-w-0 gap-4";

export default async function StandaloneRoomCreatePage({ searchParams }: StandaloneRoomCreatePageProps) {
  const params = await readSearchParams(searchParams);
  const error = typeof params.error === "string" ? params.error : "";
  const notice = getRoomCreateNotice(error);
  const profile = await getCurrentAuthProfile();

  return (
    <section className={pageStackClass}>
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([
          { label: "Отдельные номера", href: "/dashboard/properties" },
          { label: "Новый номер" },
        ])}
        compact
      />

      <AdminPageHeader
        variant="plain"
        title="Новый отдельный номер"
        description="Создайте самостоятельный номер без объекта. Он попадет в общий список и в отдельный блок на публичной странице владельца."
      />

      {notice || profile ? (
        <div className="grid gap-3">
          {notice ? <InlineNotice tone="error">{notice}</InlineNotice> : null}
          {profile ? <InlineNotice tone="soft">Подписка учитывает этот номер в общем лимите активных номеров.</InlineNotice> : null}
        </div>
      ) : null}

      <Panel padding="md" className="grid min-w-0 gap-5 max-[720px]:p-4">
        <div className="grid gap-1.5">
          <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Данные номера</h2>
          <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
            Заполните адрес, параметры, цену и сведения для публичной карточки.
          </p>
        </div>

        <form action={createOwnerRoom} className={formStackClass}>
          <RoomBaseFields
            title="Основное"
            description="Как называется номер и где он находится."
            standalone
          />

          <RoomPricingFields
            title="Вместимость и цена"
            description="Ключевые параметры номера для карточки и заявки."
          />

          <RoomFormSection title="Описание" description="Короткий анонс и подробности для гостя.">
            <div className={formStackClass}>
              <Textarea id="room-short-description-new" name="shortDescription" label="Краткое описание" />
              <Textarea id="room-full-description-new" name="fullDescription" label="Подробное описание" className="min-h-[170px]" />
            </div>
          </RoomFormSection>

          <RoomAmenitiesSection
            title="Удобства номера"
            description="Главное держим перед глазами, остальное раскрывается по тапу."
            amenities={[]}
          />

          <RoomPhotosField
            title="Фото номера"
            description="Можно выбрать до 10 фото сразу. Первое фото станет главным."
          />

          <RoomFormSection title="Контакты и занятые даты" description="Оставьте контакты и, если нужно, сразу отметьте занятый диапазон.">
            <div className={formStackClass}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input id="room-phone-new" name="phone" label="Телефон" />
                <Input id="room-telegram-new" name="telegram" label="Telegram" />
              </div>
              <RoomDateRangeField />
            </div>
          </RoomFormSection>

          <RoomPublishSettings
            title="Настройки"
            description="Что показывать гостю и как вести номер в кабинете."
            allowAgentControls
          />

          <div className="grid gap-3 md:grid-cols-2">
            <ButtonLink href="/dashboard/properties" variant="secondary" fullWidth>К общему списку</ButtonLink>
            <Button type="submit" fullWidth>Создать номер</Button>
          </div>
        </form>
      </Panel>
    </section>
  );
}
