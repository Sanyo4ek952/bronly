import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicPropertyPageData } from "@/entities/property";
import { Button, ButtonLink } from "@/shared/ui";
import { PublicRoomBrowser } from "@/widgets/public-room-browser";

type PublicPropertyPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function PublicPropertyPage({ params, searchParams }: PublicPropertyPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const propertyData = await getPublicPropertyPageData(slug, {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  });

  if (!propertyData) {
    notFound();
  }

  if (propertyData.publicUnavailableReason === "subscription_expired" || !propertyData.property) {
    return (
      <main className="br-page">
        <div className="br-container">
          <section className="br-request-success br-card" style={{ margin: "48px auto" }}>
            <h1>Страница временно недоступна</h1>
            <p>Доступ к сервису еще не продлен. Если это ваша страница, войдите в кабинет и продлите подписку.</p>
            <div className="br-request-success__actions">
              <ButtonLink href="/login" fullWidth>
                Войти в кабинет
              </ButtonLink>
              <ButtonLink href="/" variant="secondary" fullWidth>
                На главную
              </ButtonLink>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { property, rooms, filters, publicWarningText } = propertyData;
  const propertyCover = property.photos[0];

  return (
    <main className="br-page">
      <div className="br-container">
        <header className="br-header br-header--public">
          <BrandSlot />
          <nav className="br-nav" aria-label="Навигация публичной страницы">
            <a href="#rooms">Номера и цены</a>
            <a href="#features">Удобства</a>
            <a href="#details">Описание</a>
          </nav>
          <ButtonLink href={`/p/${property.slug}/request`}>Оставить заявку</ButtonLink>
        </header>

        <section className="br-public-hero br-card">
          <div className="br-public-hero__media">
            {propertyCover ? (
              <Image
                src={propertyCover.url}
                alt={property.shortTitle}
                width={1600}
                height={1000}
                unoptimized
                className="br-public-hero__image"
              />
            ) : null}
          </div>
          <div className="br-public-hero__body">
            <div>
              <h1>{property.shortTitle}</h1>
              <p>
                Россия, г. {property.city}, {property.address}
              </p>
            </div>
            <div className="br-public-hero__actions">
              {property.phone ? <Button variant="secondary">{property.phone}</Button> : null}
              {property.whatsapp ? <Button variant="secondary">Написать в WhatsApp</Button> : null}
              <ButtonLink href={`/p/${property.slug}/request`}>Оставить заявку</ButtonLink>
            </div>
          </div>
        </section>

        {publicWarningText ? (
          <div className="br-inline-notice" style={{ marginTop: 18 }}>
            {publicWarningText}
          </div>
        ) : null}

        <section id="rooms" className="br-section br-section--public">
          <div className="br-section-heading">
            <h2>Номера и цены</h2>
            <p>
              Выберите даты, количество гостей и конкретный номер. Владелец свяжется с вами и уточнит доступность.
            </p>
          </div>
          <PublicRoomBrowser propertySlug={property.slug} rooms={rooms} filters={filters} />
        </section>

        <section className="br-public-info">
          <div className="br-public-info__features" id="features">
            {property.features.map((feature) => (
              <span key={feature} className="br-feature-pill">
                {feature}
              </span>
            ))}
          </div>
          <div id="details" className="br-public-info__description br-card">
            <h2>Описание</h2>
            <p>{property.fullDescription}</p>
            <small>
              Bronly передает заявку владельцу и не подтверждает проживание от имени сервиса. Условия проживания,
              доступность дат и цены уточняются напрямую у владельца.
            </small>
            <div className="br-public-info__cta">
              <ButtonLink href={`/p/${property.slug}/request`}>Оставить заявку</ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function BrandSlot() {
  return (
    <Link href="/" className="br-logo">
      <span className="br-logo__mark" aria-hidden="true">
        b
      </span>
      <span className="br-logo__wordmark">
        Bron<span className="br-logo__accent">ly</span>
      </span>
    </Link>
  );
}
