import { ArrowUpRight } from "lucide-react";

import { createOwnerProperty } from "@/app/dashboard/properties/actions";
import { OwnerPropertyFormFields } from "@/features/property/edit-property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { AppIcon, Button, ButtonLink, DashboardPageNav, InlineNotice, Input } from "@/shared/ui";

type NewPropertyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const propertySetupSteps = [
  "Добавьте номера и задайте цену.",
  "Отметьте занятые даты.",
  "Проверьте публичную страницу и скопируйте ссылку.",
] as const;

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
    <section className="grid min-w-0 gap-6 max-[720px]:gap-5">
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([{ label: "Новый объект" }])}
        compact
      />

      <header className="grid max-w-[780px] gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Новый объект</p>
        <h1 className="[overflow-wrap:anywhere] text-[clamp(34px,4vw,50px)] font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--text)] max-[520px]:text-[32px]">
          Добавьте место для размещения
        </h1>
        <p className="text-sm leading-[1.6] text-[var(--text-muted)]">
          Заполните данные объекта. После создания можно добавить номера, цены и занятые даты.
        </p>
      </header>

      {message ? <InlineNotice tone="error" aria-live="polite">{message}</InlineNotice> : null}

      <form action={createOwnerProperty}>
        <section
          className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] max-[520px]:rounded-[20px]"
          aria-labelledby="new-property-form-title"
        >
          <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 p-7 max-[720px]:p-[18px] max-[340px]:p-[14px]">
              <div className="mb-6 grid gap-1.5">
                <h2 id="new-property-form-title" className="text-[23px] font-bold leading-[1.1] tracking-[-0.025em] text-[var(--text)]">
                  Данные объекта
                </h2>
                <p className="text-[13px] leading-[1.55] text-[var(--text-muted)]">
                  Основные сведения, контакты и правила можно уточнить позже в настройках объекта.
                </p>
              </div>

              <OwnerPropertyFormFields presentation="create" />

              <section className="mt-6 grid gap-4 border-t border-[var(--border)] pt-6" aria-labelledby="new-property-photos-title">
                <div className="grid gap-1.5">
                  <h3 id="new-property-photos-title" className="text-base font-semibold leading-[1.25] text-[var(--text)]">Фотографии объекта</h3>
                  <p className="text-[13px] leading-[1.55] text-[var(--text-muted)]">
                    Добавьте фото сразу при создании. Первое фото станет обложкой объекта.
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
                  wrapperClassName="min-w-0 [overflow-wrap:anywhere]"
                />
              </section>
            </div>

            <aside
              className="min-w-0 border-t border-[rgb(var(--color-primary-rgb)_/_0.14)] bg-[var(--surface-muted)] px-6 py-7 xl:border-l xl:border-t-0 max-[720px]:px-[18px] max-[720px]:py-[22px] max-[340px]:px-[14px]"
              aria-labelledby="new-property-next-title"
            >
              <span className="grid size-11 place-items-center rounded-[14px] bg-[var(--color-primary-soft)] text-[var(--accent-strong)]" aria-hidden="true">
                <AppIcon icon={ArrowUpRight} className="size-[19px]" strokeWidth={2.1} />
              </span>
              <h3 id="new-property-next-title" className="mt-[18px] text-[17px] font-bold text-[var(--text)]">После создания</h3>
              <p className="mt-2 text-xs leading-[1.6] text-[var(--text-muted)]">
                Откроется страница объекта, где можно продолжить подготовку к показу гостям.
              </p>
              <ol className="mt-5 grid gap-3 [counter-reset:property-step]">
                {propertySetupSteps.map((step) => (
                  <li
                    key={step}
                    className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-start gap-2.5 [counter-increment:property-step] [overflow-wrap:anywhere] text-xs leading-[1.5] text-[var(--text-muted)] before:grid before:size-6 before:place-items-center before:rounded-full before:bg-[var(--surface)] before:text-[10px] before:font-extrabold before:text-[var(--accent-strong)] before:content-[counter(property-step)]"
                  >
                    {step}
                  </li>
                ))}
              </ol>
            </aside>
          </div>

          <footer className="flex justify-end gap-3 border-t border-[var(--border)] bg-[var(--surface-subtle)] px-7 py-[18px] max-[720px]:grid max-[720px]:px-[18px] max-[720px]:py-4 max-[340px]:px-[14px]">
            <ButtonLink href="/dashboard/properties" variant="secondary" className="max-[720px]:order-2 max-[720px]:w-full">
              Вернуться к списку
            </ButtonLink>
            <Button type="submit" className="max-[720px]:order-1 max-[720px]:min-h-11 max-[720px]:w-full">
              Создать объект
              <AppIcon icon={ArrowUpRight} className="size-4" strokeWidth={2.2} aria-hidden="true" />
            </Button>
          </footer>
        </section>
      </form>
    </section>
  );
}
