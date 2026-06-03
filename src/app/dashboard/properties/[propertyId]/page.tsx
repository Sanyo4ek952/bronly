import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteOwnerProperty, updateOwnerProperty } from "@/app/dashboard/properties/actions";
import { getPropertyNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { OwnerPropertyFormFields } from "@/features/property/edit-property";
import { Button, ButtonLink, Input, StatusPill } from "@/shared/ui";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyDetailPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PropertyDetailPage({ params, searchParams }: PropertyDetailPageProps) {
  const { propertyId } = await params;
  const property = await getOwnerPropertyDetail(propertyId);

  if (!property) {
    notFound();
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : "";
  const success = typeof resolvedSearchParams.success === "string" ? resolvedSearchParams.success : "";
  const notice = getPropertyNotice(error, success);

  return (
    <section className="br-owner-stack">
      <div className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>{property.title}</h2>
            <p>
              {property.city} • {property.propertyType} • /p/{property.slug}
            </p>
          </div>
          <div className="br-owner-actions">
            <StatusPill variant={property.published && !property.isFrozen ? "active" : "inactive"}>
              {property.isFrozen ? "Заморожен" : property.published ? "Опубликован" : "Скрыт"}
            </StatusPill>
            <ButtonLink href="/dashboard/properties" variant="secondary">
              Все объекты
            </ButtonLink>
          </div>
        </div>

        <PropertySectionNav propertyId={property.id} active="property" />

        {notice ? <div className="br-inline-notice">{notice}</div> : null}
      </div>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Настройки объекта</h2>
            <p>Основные данные, контакты, правила проживания и параметры публикации.</p>
          </div>
        </div>

        <form action={updateOwnerProperty} className="br-owner-stack">
          <input type="hidden" name="propertyId" value={property.id} />
          <OwnerPropertyFormFields property={property} />

          <div className="br-active-step__actions">
            <Button type="submit">Сохранить объект</Button>
            <Link href={`/p/${property.slug}`} className="br-button br-button--secondary">
              Открыть публичную страницу
            </Link>
          </div>
        </form>
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Удаление объекта</h2>
            <p>Удаление каскадно удалит номера, сезонные цены, занятые даты и связанные списки.</p>
          </div>
        </div>

        <form action={deleteOwnerProperty} className="br-owner-danger">
          <input type="hidden" name="propertyId" value={property.id} />
          <Input
            id="property-delete-confirmation"
            name="confirmation"
            label="Введите DELETE для подтверждения"
            placeholder="DELETE"
          />
          <Button type="submit" variant="danger">
            Удалить объект
          </Button>
        </form>
      </section>
    </section>
  );
}
