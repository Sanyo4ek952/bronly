import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteOwnerProperty,
  deletePropertyPhoto,
  setPropertyPhotoPrimary,
  updateOwnerProperty,
  uploadPropertyPhoto,
} from "@/app/dashboard/properties/actions";
import { getPropertyNotice } from "@/app/dashboard/properties/page-helpers";
import { getOwnerPropertyDetail } from "@/entities/property";
import { OwnerPropertyFormFields } from "@/features/property/edit-property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { Button, DashboardPageNav, Input } from "@/shared/ui";
import {
  AdminPageHeader,
  AdminPageLayout,
  CopyLinkButton,
  DangerZone,
  ObjectSummaryCard,
  ObjectTabs,
  PhotoManager,
  StickyActions,
} from "@/widgets/property-admin";

type PropertyDetailPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getPropertyBusyRangeCount(property: NonNullable<Awaited<ReturnType<typeof getOwnerPropertyDetail>>>) {
  return property.rooms.reduce((total, room) => total + room.busyRanges.length, 0);
}

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
  const publicHref = property.ownerPublicSlug ? `/p/${property.ownerPublicSlug}` : "/dashboard/settings";
  const busyRangeCount = getPropertyBusyRangeCount(property);
  const formId = `property-edit-form-${property.id}`;

  const tabs = [
    { key: "overview", label: "Обзор", href: `/dashboard/properties/${property.id}#overview` },
    { key: "rooms", label: "Номера", href: `/dashboard/properties/${property.id}/rooms` },
    { key: "calendar", label: "Календарь", href: `/dashboard/properties/${property.id}/calendar` },
    { key: "contacts", label: "Контакты", href: `/dashboard/properties/${property.id}#contacts` },
    { key: "photos", label: "Фото", href: `/dashboard/properties/${property.id}#photos` },
  ];

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([{ label: property.title }])}
        compact
      />

      <AdminPageHeader
        compact
        title={property.title}
        description={`${[property.city, property.address].filter(Boolean).join(", ")} · ${property.propertyType}`}
        actions={property.ownerPublicSlug ? <CopyLinkButton path={publicHref} /> : null}
        notice={notice ? <div className="br-inline-notice">{notice}</div> : null}
      />

      <ObjectSummaryCard
        property={property}
        busyRangeCount={busyRangeCount}
        roomsHref={`/dashboard/properties/${property.id}/rooms`}
        calendarHref={`/dashboard/properties/${property.id}/calendar`}
        publicHref={publicHref}
        compact
        className="br-object-summary-card--mobile-only"
      />

      <ObjectTabs active="overview" items={tabs} />

      <AdminPageLayout
        main={
          <div className="br-owner-stack">
            <section className="br-dashboard-block br-card">
              <div className="br-dashboard-block__header">
                <div>
                  <h2>Редактирование объекта</h2>
                  <p>Данные, контакты, правила проживания и параметры публикации собраны в понятные секции.</p>
                </div>
              </div>

              <form id={formId} action={updateOwnerProperty} className="br-owner-stack">
                <input type="hidden" name="propertyId" value={property.id} />
                <OwnerPropertyFormFields property={property} />
              </form>
            </section>

            <PhotoManager
              title="Фото объекта"
              description="Добавьте несколько фото. Первое фото используется как обложка в кабинете и на публичной странице."
              emptyText="Фото объекта пока нет. После загрузки первое фото станет обложкой в кабинете и на публичной странице."
              photos={property.photos}
              uploadAction={uploadPropertyPhoto}
              primaryAction={setPropertyPhotoPrimary}
              deleteAction={deletePropertyPhoto}
              hiddenFields={[{ name: "propertyId", value: property.id }]}
              uploadInputId="property-photo-upload"
              uploadLabel="Добавить фото объекта"
              uploadDescription="Можно выбрать до 10 фото за раз. JPG, PNG, WebP или GIF, до 5 МБ каждое."
              entityTitle={property.title}
            />

            <DangerZone
              title="Удаление объекта"
              description="Удаление каскадно удалит номера, сезонные цены, занятые даты и связанные списки."
            >
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
            </DangerZone>

            <StickyActions desktopInline>
              <Button type="submit" form={formId}>
                Сохранить объект
              </Button>
              <Link href={publicHref} className="br-button br-button--secondary">
                {property.ownerPublicSlug ? "Открыть публичную страницу" : "Настройки профиля"}
              </Link>
            </StickyActions>
          </div>
        }
        aside={
          <div className="br-owner-stack">
            <ObjectSummaryCard
              property={property}
              busyRangeCount={busyRangeCount}
              roomsHref={`/dashboard/properties/${property.id}/rooms`}
              calendarHref={`/dashboard/properties/${property.id}/calendar`}
              publicHref={publicHref}
              className="br-object-summary-card--desktop-sticky"
            />
            <DangerZone
              compact
              title="Удаление объекта"
              description="Сначала убедитесь, что данные больше не нужны: удаление необратимо."
            >
              <div className="br-owner-stack br-owner-stack--compact">
                <CopyLinkButton path={publicHref} disabled={!property.ownerPublicSlug} />
                <Link href="#property-delete-confirmation" className="br-button br-button--danger">
                  Перейти к удалению
                </Link>
              </div>
            </DangerZone>
          </div>
        }
      />
    </section>
  );
}
