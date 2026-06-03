import { notFound } from "next/navigation";

import {
  createRoomBusyRange,
  deleteRoomBusyRange,
  updateRoomBusyRange,
} from "@/app/dashboard/properties/actions";
import { formatMoney, getCalendarNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { Button, Input } from "@/shared/ui";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyCalendarPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertyCalendarPage({ params, searchParams }: PropertyCalendarPageProps) {
  const { propertyId } = await params;
  const property = await getOwnerPropertyDetail(propertyId);

  if (!property) {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getCalendarNotice(error, success);

  return (
    <section className="br-owner-stack">
      <div className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>{property.title}</h2>
            <p>Ручное управление занятыми датами по каждому номеру.</p>
          </div>
        </div>

        <PropertySectionNav propertyId={property.id} active="calendar" />

        {notice ? <div className="br-inline-notice">{notice}</div> : null}
      </div>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Календарь занятости</h2>
            <p>Отмечайте занятые даты без автоматического подтверждения заявок.</p>
          </div>
        </div>

        <div className="br-owner-stack">
          {property.rooms.length ? (
            property.rooms.map((room) => (
              <article key={`${room.id}-calendar`} className="br-owner-editor">
                <div className="br-owner-editor__header">
                  <div>
                    <strong>{room.title}</strong>
                    <p>
                      Базовая цена: {formatMoney(room.pricePerNight)} • Занятых диапазонов: {room.busyRanges.length}
                    </p>
                  </div>
                </div>

                {room.busyRanges.length ? (
                  <div className="br-owner-stack">
                    {room.busyRanges.map((busyRange) => (
                      <form key={busyRange.id} action={updateRoomBusyRange} className="br-owner-inline-form">
                        <input type="hidden" name="propertyId" value={property.id} />
                        <input type="hidden" name="busyRangeId" value={busyRange.id} />
                        <Input id={`busy-start-${busyRange.id}`} name="startsOn" type="date" label="С" defaultValue={busyRange.startsOn} />
                        <Input id={`busy-end-${busyRange.id}`} name="endsOn" type="date" label="По" defaultValue={busyRange.endsOn} />
                        <Input id={`busy-label-${busyRange.id}`} name="label" label="Пометка" defaultValue={busyRange.label} />
                        <Input id={`busy-note-${busyRange.id}`} name="note" label="Комментарий" defaultValue={busyRange.note} />
                        <div className="br-owner-actions">
                          <Button type="submit">Сохранить</Button>
                          <Button type="submit" variant="danger" formAction={deleteRoomBusyRange}>
                            Удалить
                          </Button>
                        </div>
                      </form>
                    ))}
                  </div>
                ) : (
                  <p className="br-owner-muted">Занятые даты еще не отмечены.</p>
                )}

                <form action={createRoomBusyRange} className="br-owner-inline-form">
                  <input type="hidden" name="propertyId" value={property.id} />
                  <input type="hidden" name="roomId" value={room.id} />
                  <Input id={`busy-start-new-${room.id}`} name="startsOn" type="date" label="С" />
                  <Input id={`busy-end-new-${room.id}`} name="endsOn" type="date" label="По" />
                  <Input id={`busy-label-new-${room.id}`} name="label" label="Пометка" placeholder="Например, занято" />
                  <Input id={`busy-note-new-${room.id}`} name="note" label="Комментарий" />
                  <Button type="submit">Добавить занятые даты</Button>
                </form>
              </article>
            ))
          ) : (
            <p className="br-owner-muted">Сначала добавьте номер, затем отмечайте занятые даты.</p>
          )}
        </div>
      </section>
    </section>
  );
}
