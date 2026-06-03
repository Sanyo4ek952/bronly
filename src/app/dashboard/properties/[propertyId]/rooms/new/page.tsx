import { notFound } from "next/navigation";

import { createOwnerRoom } from "@/app/dashboard/properties/actions";
import { getRoomCreateNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { Button, ButtonLink, Input, Textarea } from "@/shared/ui";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyRoomCreatePageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertyRoomCreatePage({ params, searchParams }: PropertyRoomCreatePageProps) {
  const { propertyId } = await params;
  const property = await getOwnerPropertyDetail(propertyId);

  if (!property) {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const notice = getRoomCreateNotice(error);

  return (
    <section className="br-owner-stack">
      <div className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>{property.title}</h2>
            <p>Добавьте новый номер для этого объекта.</p>
          </div>
          <ButtonLink href={`/dashboard/properties/${property.id}/rooms`} variant="secondary">
            К списку номеров
          </ButtonLink>
        </div>

        <PropertySectionNav propertyId={property.id} active="rooms" />

        {notice ? <div className="br-inline-notice">{notice}</div> : null}
      </div>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Добавить номер</h2>
            <p>Заполните основные данные номера, а затем сохраните его в объект.</p>
          </div>
        </div>

        <form action={createOwnerRoom} className="br-owner-editor br-owner-editor--muted">
          <input type="hidden" name="propertyId" value={property.id} />
          <div className="br-property-form__grid">
            <Input id="room-title-new" name="title" label="Название номера" />
            <Input id="room-subtitle-new" name="subtitle" label="Подзаголовок" />
            <Input id="room-capacity-new" name="capacity" type="number" min="1" label="Гостей" defaultValue="2" />
            <Input id="room-bedrooms-new" name="bedrooms" type="number" min="1" label="Спален" defaultValue="1" />
            <Input id="room-area-new" name="area" type="number" min="0" label="Площадь, м²" defaultValue="0" />
            <Input
              id="room-price-new"
              name="pricePerNight"
              type="number"
              min="0"
              step="0.01"
              label="Базовая цена за ночь"
              defaultValue="0"
            />
          </div>
          <Textarea id="room-amenities-new" name="amenities" label="Удобства номера" />
          <label className="br-toggle">
            <span>Номер активен</span>
            <input type="checkbox" name="isActive" defaultChecked />
          </label>
          <div className="br-active-step__actions">
            <Button type="submit">Сохранить номер</Button>
          </div>
        </form>
      </section>
    </section>
  );
}
