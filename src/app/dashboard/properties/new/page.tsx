import Link from "next/link";

import { createOwnerProperty } from "@/app/dashboard/properties/actions";
import { OwnerPropertyFormFields } from "@/features/property/edit-property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { Button, DashboardPageNav, Input } from "@/shared/ui";

type NewPropertyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(error: string) {
  switch (error) {
    case "validation":
      return "Заполните обязательные поля объекта.";
    case "duplicate":
      return "Не удалось создать объект. Попробуйте изменить название.";
    case "photo-type":
      return "Для фото объекта поддерживаются только JPG, PNG, WebP и GIF.";
    case "photo-size":
      return "Размер фото объекта должен быть не больше 5 МБ.";
    case "photo-count":
      return "За один раз можно загрузить до 10 фото объекта.";
    default:
      return error ? "Не удалось создать объект." : "";
  }
}

export default async function NewPropertyPage({ searchParams }: NewPropertyPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const message = getMessage(error);

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([{ label: "Новый объект" }])}
        compact
      />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Новый объект</h2>
            <p>Создайте объект владельца и сразу подготовьте его к публикации и приему заявок.</p>
          </div>
        </div>

        {message ? <div className="br-inline-notice">{message}</div> : null}

        <form action={createOwnerProperty} className="br-owner-stack" encType="multipart/form-data">
          <OwnerPropertyFormFields />

          <section className="br-owner-photo-section br-owner-photo-section--create">
            <div className="br-owner-photo-section__copy">
              <h3>Фотографии объекта</h3>
              <p>Добавьте фото сразу при создании объекта. Первое фото станет обложкой объекта.</p>
            </div>
            <Input
              id="property-photos-new"
              name="photos"
              type="file"
              accept="image/*"
              multiple
              label="Фотографии объекта"
              description="Можно выбрать до 10 фото сразу. JPG, PNG, WebP или GIF, до 5 МБ каждое."
              wrapperClassName="br-owner-photo-upload__field"
            />
          </section>

          <div className="br-active-step__actions">
            <Link href="/dashboard/properties" className="br-button br-button--secondary">
              К списку объектов
            </Link>
            <Button type="submit">Создать объект</Button>
          </div>
        </form>
      </section>
    </section>
  );
}
