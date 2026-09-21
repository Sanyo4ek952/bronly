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
import { PropertySetupFlow } from "@/features/property/setup/ui/setup-flow";
import { OwnerPropertyFormFields } from "@/features/property/edit-property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { Button, ButtonLink, DashboardPageNav, InlineNotice, Input, Panel, SubmitButton } from "@/shared/ui";
import {
  AdminPageHeader,
  CopyLinkButton,
  DangerZone,
  PhotoManager,
  StatusBadge,
} from "@/widgets/property-admin";

type PropertyDetailPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid min-w-0 gap-6 max-[720px]:gap-5";
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
  const formId = `property-edit-form-${property.id}`;
  const initialStep = success === "saved" || success.includes("photo") || error.includes("photo") ? 1 : 0;

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

      <PropertySetupFlow key={`${success}-${error}`} initialStep={initialStep} steps={[
        { title: "Основная информация", description: "Заполните сведения об объекте, контакты и правила проживания.", content: (
          <Panel padding="md">
            <form id={formId} action={updateOwnerProperty} className="grid gap-5">
              <input type="hidden" name="propertyId" value={property.id} />
              <OwnerPropertyFormFields property={property} presentation="create" />
              <div className="flex justify-end border-t border-[var(--border)] pt-5">
                <SubmitButton pendingLabel="Сохраняем…">Сохранить и перейти к фото</SubmitButton>
              </div>
            </form>
          </Panel>
        ) },
        { title: "Фотографии", description: "Покажите гостям здание, территорию и общие пространства.", content: (
            <PhotoManager
              flatUpload
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
        ) },
        { title: "Номера", description: "Добавьте номера, которые гости смогут выбрать для заявки.", content: (
          <Panel padding="md" className="grid gap-5">
            {property.rooms.length ? (
              <div className="grid gap-3">
                {property.rooms.map((room) => (
                  <div key={room.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                    <div><h3 className="font-semibold text-[var(--text)]">{room.title}</h3><p className="mt-1 text-xs text-[var(--text-muted)]">{room.isActive ? "Опубликован" : "В архиве"}</p></div>
                    <ButtonLink href={`/dashboard/properties/${property.id}/rooms/${room.id}`} variant="secondary">Открыть номер</ButtonLink>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-2 py-6 text-center">
                <h3 className="text-xl font-semibold text-[var(--text)]">Добавьте первый номер</h3>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--text-muted)]">Объект уже создан. Теперь укажите удобства, фотографии и цену номера, чтобы гости могли оставить заявку.</p>
              </div>
            )}
            <ButtonLink href={`/dashboard/properties/${property.id}/rooms/new`} className="justify-self-center">Добавить номер</ButtonLink>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href={`/dashboard/properties/${property.id}/rooms`} variant="secondary">Все номера</ButtonLink>
              <ButtonLink href={`/dashboard/properties/${property.id}/calendar`} variant="secondary">Календарь занятости</ButtonLink>
            </div>
          </Panel>
        ) },
      ]} />
      <details className="border-t border-[var(--border)] pt-4">
        <summary className="cursor-pointer text-sm text-[var(--text-muted)]">Удаление объекта</summary>
        <div className="mt-4">
            <DangerZone
              title="Удаление объекта"
              description="Удаление каскадно удалит номера, сезонные цены, занятые даты и связанные списки."
            >
              <form action={deleteOwnerProperty} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
        </div>
      </details>
    </section>
  );
}
