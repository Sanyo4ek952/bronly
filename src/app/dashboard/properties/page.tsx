import Image from "next/image";
import { HousePlus, Settings } from "lucide-react";
import Link from "next/link";

import { getOwnerInventory } from "@/entities/property";
import { AddInventoryButton } from "@/widgets/add-inventory-button";
import { AppIcon, ButtonLink, StatusPill } from "@/shared/ui";

type PropertiesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(error: string, success: string) {
  if (success === "deleted") {
    return "Объект удалён.";
  }

  if (success === "room-deleted") {
    return "Номер удалён.";
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
  const inventory = await getOwnerInventory();
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  const message = getMessage(error, success);

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Объекты и номера</h2>
          <p>Управляйте объектами и отдельными номерами в одном месте. У объекта внутри остаются его номера, а отдельный номер живет как самостоятельная карточка.</p>
        </div>
        <AddInventoryButton />
      </div>

      {message ? <div className="br-inline-notice">{message}</div> : null}

      {inventory.length ? (
        <div className="br-owner-property-list">
          {inventory.map((item) =>
            item.kind === "standalone_room" ? (
              <article key={item.id} className="br-owner-property-card">
                <Link
                  href={`/dashboard/rooms/${item.id}`}
                  className="br-owner-property-card__link"
                  aria-label={`Открыть карточку номера ${item.title}`}
                />
                <div className="br-owner-property-card__media">
                  {item.coverImageUrl ? (
                    <Image
                      src={item.coverImageUrl}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1180px) 25vw, (min-width: 700px) 40vw, 100vw"
                      unoptimized
                      className="br-owner-property-card__image"
                    />
                  ) : (
                    <div className="br-owner-property-card__image br-owner-property-card__image--placeholder" aria-hidden="true" />
                  )}
                </div>
                <div className="br-owner-property-card__header">
                  <div>
                    <strong>{item.title}</strong>
                    <p>Отдельный номер • {item.propertyType}</p>
                  </div>
                  <div className="br-owner-property-card__topbar">
                    <StatusPill variant={item.isActive ? "active" : "inactive"}>{item.isActive ? "Активен" : "Неактивен"}</StatusPill>
                    <Link href={`/dashboard/rooms/${item.id}/settings`} className="br-owner-property-card__settings" aria-label={`Открыть настройки номера ${item.title}`}>
                      <AppIcon icon={Settings} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
                <div className="br-owner-property-card__meta">
                  <p className="br-owner-property-card__address">{item.city}, {item.address}</p>
                  <div className="br-summary-card__rows">
                    <div className="br-summary-card__row">
                      <span>Тип</span>
                      <strong>{item.propertyType}</strong>
                    </div>
                    <div className="br-summary-card__row">
                      <span>Цена</span>
                      <strong>{Math.round(item.pricePerNight).toLocaleString("ru-RU")} ₽</strong>
                    </div>
                  </div>
                </div>
                <div className="br-owner-actions">
                  <ButtonLink href={`/dashboard/rooms/${item.id}`} variant="secondary">Открыть номер</ButtonLink>
                  <ButtonLink href={`/dashboard/rooms/${item.id}/calendar`} variant="secondary">Календарь</ButtonLink>
                </div>
              </article>
            ) : (
              <article key={item.id} className="br-owner-property-card">
                <Link
                  href={`/dashboard/properties/${item.id}/rooms`}
                  className="br-owner-property-card__link"
                  aria-label={`Открыть номера объекта ${item.title}`}
                />
                <div className="br-owner-property-card__media">
                  {item.coverImageUrl ? (
                    <Image
                      src={item.coverImageUrl}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1180px) 25vw, (min-width: 700px) 40vw, 100vw"
                      unoptimized
                      className="br-owner-property-card__image"
                    />
                  ) : (
                    <div className="br-owner-property-card__image br-owner-property-card__image--placeholder" aria-hidden="true" />
                  )}
                </div>

                <div className="br-owner-property-card__header">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.propertyType}</p>
                  </div>

                  <div className="br-owner-property-card__topbar">
                    <StatusPill variant={item.published && !item.isFrozen ? "active" : "inactive"}>
                      {item.isFrozen ? "Заморожен" : item.published ? "Опубликован" : "Скрыт"}
                    </StatusPill>
                    <Link href={`/dashboard/properties/${item.id}`} className="br-owner-property-card__settings" aria-label={`Открыть настройки объекта ${item.title}`}>
                      <AppIcon icon={Settings} aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <div className="br-owner-property-card__meta">
                  <p className="br-owner-property-card__address">{item.city}, {item.address}</p>

                  <div className="br-summary-card__rows">
                    <div className="br-summary-card__row">
                      <span>Номера</span>
                      <strong>
                        {item.roomCount} {getRoomsLabel(item.roomCount)}
                      </strong>
                    </div>
                    <div className="br-summary-card__row">
                      <span>Активные номера</span>
                      <strong>{item.activeRoomCount}</strong>
                    </div>
                  </div>
                </div>

                <div className="br-owner-actions">
                  <ButtonLink href={`/dashboard/properties/${item.id}/rooms`} variant="secondary">
                    Открыть номера
                  </ButtonLink>
                  <Link href={item.ownerPublicSlug ? `/p/${item.ownerPublicSlug}` : "/dashboard/settings"} className="br-link-button">
                    {item.ownerPublicSlug ? "Открыть публичную ссылку" : "Заполнить slug владельца"}
                  </Link>
                </div>
              </article>
            ),
          )}
        </div>
      ) : (
        <article className="br-empty-card br-card">
          <div className="br-empty-card__art" aria-hidden="true">
            <AppIcon icon={HousePlus} />
          </div>
          <strong>Пока нет объектов и номеров</strong>
          <p>Добавьте объект с номерами или создайте отдельный номер, чтобы перейти к ценам, фото и календарю занятости.</p>
          <div className="br-owner-stack" style={{ width: "100%" }}>
            <ButtonLink href="/dashboard/properties/new" fullWidth>
              Создать объект
            </ButtonLink>
            <ButtonLink href="/dashboard/rooms/new" variant="secondary" fullWidth>
              Создать отдельный номер
            </ButtonLink>
          </div>
        </article>
      )}
    </section>
  );
}
