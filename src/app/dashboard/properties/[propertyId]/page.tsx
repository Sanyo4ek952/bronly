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
import { Button, ButtonLink, DashboardPageNav, InlineNotice, Input, Panel } from "@/shared/ui";
import {
  AdminPageHeader,
  AdminPageLayout,
  CopyLinkButton,
  DangerZone,
  ObjectStats,
  ObjectSummaryCard,
  PhotoManager,
  StatusBadge,
  StickyActions,
} from "@/widgets/property-admin";
import { PropertySectionNav } from "@/widgets/property-section-nav";

type PropertyDetailPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid min-w-0 gap-6 max-[720px]:gap-5";
const contentStackClass = "grid min-w-0 gap-4";
const sectionCardClass =
  "grid gap-4 rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-5 max-[720px]:rounded-[20px] max-[720px]:p-4";
const sectionHeaderClass = "flex flex-wrap items-start justify-between gap-3";
const destroyFormClass = "grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end";

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
  const publicActionLabel = property.ownerPublicSlug ? "Открыть публичную страницу" : "Настройки профиля";

  return (
    <section className={pageStackClass}>
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([{ label: property.title }])}
        compact
      />

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
            Объект владельца
          </p>
          <StatusBadge kind="property" published={property.published} isFrozen={property.isFrozen} />
        </div>
        <AdminPageHeader
          variant="plain"
          title={property.title}
          description={`${property.propertyType} · ${[property.city, property.address].filter(Boolean).join(", ")}`}
          actions={
            property.ownerPublicSlug ? (
              <>
                <CopyLinkButton path={publicHref} />
                <ButtonLink href={publicHref}>Открыть страницу</ButtonLink>
              </>
            ) : (
              <ButtonLink href="/dashboard/settings">Настроить публичную страницу</ButtonLink>
            )
          }
        />
      </div>

      {notice ? <InlineNotice tone={error ? "error" : "default"}>{notice}</InlineNotice> : null}

      <Panel padding="sm" surface="subtle" className="rounded-[var(--radius-lg)]">
        <PropertySectionNav propertyId={property.id} active="property" />
      </Panel>

      <Panel padding="md" className="grid gap-4 xl:hidden" aria-label="Состояние объекта">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold leading-[1.2] text-[var(--text)]">Состояние объекта</h2>
          <StatusBadge kind="property" published={property.published} isFrozen={property.isFrozen} />
        </div>
        <ObjectStats
          compact
          stackOnMobile={false}
          items={[
            { label: "Номера", value: String(property.rooms.length) },
            { label: "Активные", value: String(property.rooms.filter((room) => room.isActive).length) },
            { label: "Занятые даты", value: String(busyRangeCount), tone: "accent" },
          ]}
        />
        <div className="grid gap-2.5 sm:grid-cols-3">
          <ButtonLink href={`/dashboard/properties/${property.id}/rooms`} variant="secondary" fullWidth>
            Номера
          </ButtonLink>
          <ButtonLink href={`/dashboard/properties/${property.id}/calendar`} variant="secondary" fullWidth>
            Календарь
          </ButtonLink>
          <ButtonLink href={publicHref} variant="secondary" fullWidth>
            {publicActionLabel}
          </ButtonLink>
        </div>
      </Panel>

      <AdminPageLayout
        main={
          <div className={contentStackClass}>
            <section id="overview" className={`${sectionCardClass} scroll-mt-24`}>
              <div className={sectionHeaderClass}>
                <div className="grid gap-1.5">
                  <h2 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Редактирование объекта</h2>
                  <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
                    Данные, контакты, правила проживания и параметры публикации собраны в понятные секции.
                  </p>
                </div>
              </div>

              <form id={formId} action={updateOwnerProperty} className={pageStackClass}>
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
              <form action={deleteOwnerProperty} className={destroyFormClass}>
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
              <ButtonLink href={publicHref} variant="secondary" fullWidth>
                {property.ownerPublicSlug ? "Открыть публичную страницу" : "Настройки профиля"}
              </ButtonLink>
            </StickyActions>
          </div>
        }
        aside={
          <div className={pageStackClass}>
            <ObjectSummaryCard
              property={property}
              busyRangeCount={busyRangeCount}
              roomsHref={`/dashboard/properties/${property.id}/rooms`}
              calendarHref={`/dashboard/properties/${property.id}/calendar`}
              publicHref={publicHref}
              publicActionLabel={publicActionLabel}
              className="hidden xl:grid xl:sticky xl:top-5"
            />
          </div>
        }
      />
    </section>
  );
}
