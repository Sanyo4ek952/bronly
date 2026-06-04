import Image from "next/image";
import Link from "next/link";

import { getOwnerProperties } from "@/entities/property";
import { ButtonLink, StatusPill } from "@/shared/ui";

type PropertiesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(error: string, success: string) {
  if (success === "deleted") {
    return "Объект удалён.";
  }

  if (error) {
    return "Не удалось выполнить действие. Проверьте данные и попробуйте ещё раз.";
  }

  return "";
}

function getRoomsLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "номер";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "номера";
  }

  return "номеров";
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const properties = await getOwnerProperties();
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  const message = getMessage(error, success);

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Объекты владельца</h2>
          <p>Управляйте объектами, номерами, ценами и календарём занятости в одном кабинете.</p>
        </div>
        <ButtonLink href="/dashboard/properties/new">Добавить объект</ButtonLink>
      </div>

      {message ? <div className="br-inline-notice">{message}</div> : null}

      {properties.length ? (
        <div className="br-owner-property-list">
          {properties.map((property) => (
            <article key={property.id} className="br-owner-property-card">
              <Link
                href={`/dashboard/properties/${property.id}/rooms`}
                className="br-owner-property-card__link"
                aria-label={`Открыть номера объекта ${property.title}`}
              />

              <div className="br-owner-property-card__media">
                {property.coverImageUrl ? (
                  <Image
                    src={property.coverImageUrl}
                    alt={property.title}
                    width={1200}
                    height={675}
                    unoptimized
                    className="br-owner-property-card__image"
                  />
                ) : (
                  <div className="br-owner-property-card__image br-owner-property-card__image--placeholder" aria-hidden="true" />
                )}
              </div>

              <div className="br-owner-property-card__header">
                <div>
                  <strong>{property.title}</strong>
                  <p>{property.propertyType}</p>
                </div>

                <div className="br-owner-property-card__topbar">
                  <StatusPill variant={property.published && !property.isFrozen ? "active" : "inactive"}>
                    {property.isFrozen ? "Заморожен" : property.published ? "Опубликован" : "Скрыт"}
                  </StatusPill>
                  <Link
                    href={`/dashboard/properties/${property.id}`}
                    className="br-owner-property-card__settings"
                    aria-label={`Открыть настройки объекта ${property.title}`}
                  >
                    ⚙
                  </Link>
                </div>
              </div>

              <div className="br-owner-property-card__meta">
                <p className="br-owner-property-card__address">
                  {property.city}, {property.address}
                </p>

                <div className="br-summary-card__rows">
                  <div className="br-summary-card__row">
                    <span>Номера</span>
                    <strong>
                      {property.roomCount} {getRoomsLabel(property.roomCount)}
                    </strong>
                  </div>
                  <div className="br-summary-card__row">
                    <span>Активные номера</span>
                    <strong>{property.activeRoomCount}</strong>
                  </div>
                </div>
              </div>

              <div className="br-owner-actions">
                <ButtonLink href={`/dashboard/properties/${property.id}/rooms`} variant="secondary">
                  Открыть номера
                </ButtonLink>
                <Link href={property.ownerPublicSlug ? `/p/${property.ownerPublicSlug}` : "/dashboard/settings"} className="br-link-button">
                  {property.ownerPublicSlug ? "Открыть публичную ссылку" : "Заполнить slug владельца"}
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <article className="br-empty-card br-card">
          <div className="br-empty-card__art" aria-hidden="true" />
          <strong>Пока нет объектов</strong>
          <p>Добавьте первый объект, чтобы перейти к номерам, ценам и календарю занятости.</p>
          <ButtonLink href="/dashboard/properties/new" fullWidth>
            Создать объект
          </ButtonLink>
        </article>
      )}
    </section>
  );
}
