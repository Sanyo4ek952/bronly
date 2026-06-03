import { notFound } from "next/navigation";

import {
  createRoomSeasonalPrice,
  deleteOwnerRoom,
  deleteRoomSeasonalPrice,
  updateOwnerRoom,
  updateRoomSeasonalPrice,
} from "@/app/dashboard/properties/actions";
import { getRoomsNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { Button, ButtonLink, Input, StatusPill, Textarea } from "@/shared/ui";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyRoomsPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertyRoomsPage({ params, searchParams }: PropertyRoomsPageProps) {
  const { propertyId } = await params;
  const property = await getOwnerPropertyDetail(propertyId);

  if (!property) {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getRoomsNotice(error, success);

  return (
    <section className="br-owner-stack">
      <div className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>{property.title}</h2>
            <p>Список существующих номеров объекта и управление их ценами.</p>
          </div>
        </div>

        <PropertySectionNav propertyId={property.id} active="rooms" />

        {notice ? <div className="br-inline-notice">{notice}</div> : null}
      </div>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Номера и цены</h2>
            <p>Откройте нужный номер, обновите его данные или добавьте новый номер через отдельную форму.</p>
          </div>
          <ButtonLink href={`/dashboard/properties/${property.id}/rooms/new`}>Добавить номер</ButtonLink>
        </div>

        <div className="br-owner-stack">
          {property.rooms.length ? (
            property.rooms.map((room) => (
              <article key={room.id} className="br-owner-editor">
                <div className="br-owner-editor__header">
                  <div>
                    <strong>{room.title}</strong>
                    <p>
                      {room.capacity} гостя • {room.bedrooms} спальни • {room.area} м²
                    </p>
                  </div>
                  <StatusPill variant={room.isActive ? "active" : "inactive"}>
                    {room.isActive ? "Активен" : "Неактивен"}
                  </StatusPill>
                </div>

                <form action={updateOwnerRoom} className="br-owner-stack">
                  <input type="hidden" name="propertyId" value={property.id} />
                  <input type="hidden" name="roomId" value={room.id} />
                  <div className="br-property-form__grid">
                    <Input id={`room-title-${room.id}`} name="title" label="Название" defaultValue={room.title} />
                    <Input id={`room-subtitle-${room.id}`} name="subtitle" label="Подзаголовок" defaultValue={room.subtitle} />
                    <Input
                      id={`room-capacity-${room.id}`}
                      name="capacity"
                      type="number"
                      min="1"
                      label="Гостей"
                      defaultValue={String(room.capacity)}
                    />
                    <Input
                      id={`room-bedrooms-${room.id}`}
                      name="bedrooms"
                      type="number"
                      min="1"
                      label="Спален"
                      defaultValue={String(room.bedrooms)}
                    />
                    <Input
                      id={`room-area-${room.id}`}
                      name="area"
                      type="number"
                      min="0"
                      label="Площадь, м²"
                      defaultValue={String(room.area)}
                    />
                    <Input
                      id={`room-price-${room.id}`}
                      name="pricePerNight"
                      type="number"
                      min="0"
                      step="0.01"
                      label="Базовая цена за ночь"
                      defaultValue={String(room.pricePerNight)}
                    />
                  </div>

                  <Textarea
                    id={`room-amenities-${room.id}`}
                    name="amenities"
                    label="Удобства"
                    defaultValue={room.amenities.join("\n")}
                  />

                  <label className="br-toggle">
                    <span>Номер активен</span>
                    <input type="checkbox" name="isActive" defaultChecked={room.isActive} />
                  </label>

                  <div className="br-active-step__actions">
                    <Button type="submit">Сохранить номер</Button>
                  </div>
                </form>

                <div className="br-owner-stack">
                  <strong>Сезонные цены</strong>
                  {room.seasonalPrices.length ? (
                    room.seasonalPrices.map((seasonalPrice) => (
                      <form key={seasonalPrice.id} action={updateRoomSeasonalPrice} className="br-owner-inline-form">
                        <input type="hidden" name="propertyId" value={property.id} />
                        <input type="hidden" name="seasonalPriceId" value={seasonalPrice.id} />
                        <Input id={`season-start-${seasonalPrice.id}`} name="startsOn" type="date" label="С" defaultValue={seasonalPrice.startsOn} />
                        <Input id={`season-end-${seasonalPrice.id}`} name="endsOn" type="date" label="По" defaultValue={seasonalPrice.endsOn} />
                        <Input
                          id={`season-price-${seasonalPrice.id}`}
                          name="pricePerNight"
                          type="number"
                          step="0.01"
                          min="0"
                          label="Цена за ночь"
                          defaultValue={String(seasonalPrice.pricePerNight)}
                        />
                        <label className="br-toggle">
                          <span>Активна</span>
                          <input type="checkbox" name="isActive" defaultChecked={seasonalPrice.isActive} />
                        </label>
                        <div className="br-owner-actions">
                          <Button type="submit">Сохранить</Button>
                          <Button type="submit" variant="danger" formAction={deleteRoomSeasonalPrice}>
                            Удалить
                          </Button>
                        </div>
                      </form>
                    ))
                  ) : (
                    <p className="br-owner-muted">Сезонные цены пока не добавлены.</p>
                  )}

                  <form action={createRoomSeasonalPrice} className="br-owner-inline-form">
                    <input type="hidden" name="propertyId" value={property.id} />
                    <input type="hidden" name="roomId" value={room.id} />
                    <Input id={`season-start-new-${room.id}`} name="startsOn" type="date" label="С" />
                    <Input id={`season-end-new-${room.id}`} name="endsOn" type="date" label="По" />
                    <Input
                      id={`season-price-new-${room.id}`}
                      name="pricePerNight"
                      type="number"
                      step="0.01"
                      min="0"
                      label="Цена за ночь"
                    />
                    <label className="br-toggle">
                      <span>Активна</span>
                      <input type="checkbox" name="isActive" defaultChecked />
                    </label>
                    <Button type="submit">Добавить сезонную цену</Button>
                  </form>
                </div>

                <form action={deleteOwnerRoom} className="br-owner-danger">
                  <input type="hidden" name="propertyId" value={property.id} />
                  <input type="hidden" name="roomId" value={room.id} />
                  <Input
                    id={`room-delete-${room.id}`}
                    name="confirmation"
                    label="Введите DELETE для удаления номера"
                    placeholder="DELETE"
                  />
                  <Button type="submit" variant="danger">
                    Удалить номер
                  </Button>
                </form>
              </article>
            ))
          ) : (
            <p className="br-owner-muted">В объекте пока нет номеров. Нажмите «Добавить номер», чтобы создать первый.</p>
          )}
        </div>
      </section>
    </section>
  );
}
