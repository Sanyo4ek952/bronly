import Link from "next/link";

import { createOwnerProperty } from "@/app/dashboard/properties/actions";
import { OwnerPropertyFormFields } from "@/features/property/edit-property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { Button, DashboardPageNav, InlineNotice, Input } from "@/shared/ui";

type NewPropertyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const pageStackClass = "grid gap-4";
const sectionCardClass =
  "grid gap-4 rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-5 max-[720px]:rounded-[20px] max-[720px]:p-4";
const sectionHeaderClass = "flex flex-wrap items-start justify-between gap-3";
const photoSectionClass =
  "grid gap-4 rounded-[20px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.96),rgb(243_248_247_/_0.86))] p-[18px] max-[720px]:rounded-[18px] max-[720px]:p-4";
const formActionsClass = "grid gap-3 md:grid-cols-2";

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
    <section className={pageStackClass}>
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([{ label: "Новый объект" }])}
        compact
      />

      <section className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="grid gap-2">
            <h1 className="text-[clamp(24px,3vw,32px)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-text)]">
              Новый объект
            </h1>
            <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
              Создайте объект владельца и сразу подготовьте его к публикации и приему заявок.
            </p>
          </div>
        </div>

        {message ? <InlineNotice>{message}</InlineNotice> : null}

        <form action={createOwnerProperty} className={pageStackClass}>
          <OwnerPropertyFormFields />

          <section className={photoSectionClass}>
            <div className="grid gap-1.5">
              <h3 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">Фотографии объекта</h3>
              <p className="text-sm leading-[1.55] text-[var(--color-muted)]">
                Добавьте фото сразу при создании объекта. Первое фото станет обложкой объекта.
              </p>
            </div>
            <Input
              id="property-photos-new"
              name="photos"
              type="file"
              accept="image/*"
              multiple
              label="Фотографии объекта"
              description="Можно выбрать до 10 фото сразу. JPG, PNG, WebP или GIF, до 5 МБ каждое."
              wrapperClassName="grid max-w-[420px] gap-1.5"
            />
          </section>

          <div className={formActionsClass}>
            <Link
              href="/dashboard/properties"
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 text-[13px] font-bold leading-none text-[var(--text)] transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms] hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)]"
            >
              К списку объектов
            </Link>
            <Button type="submit" fullWidth>
              Создать объект
            </Button>
          </div>
        </form>
      </section>
    </section>
  );
}
