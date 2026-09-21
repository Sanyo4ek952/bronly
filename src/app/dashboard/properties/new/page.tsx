import { ArrowRight, Building2, Hotel, House, KeyRound } from "lucide-react";
import Link from "next/link";

import { createOwnerProperty } from "@/app/dashboard/properties/actions";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { AppIcon, Button, ButtonLink, DashboardPageNav, InlineNotice, Input } from "@/shared/ui";

type NewPropertyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const propertyTypeOptions = [
  {
    id: "guest-house",
    value: "Гостевой дом",
    title: "Гостевой дом",
    description: "Несколько номеров в одном объекте",
    icon: Building2,
  },
  {
    id: "mini-hotel",
    value: "Мини-отель",
    title: "Мини-отель",
    description: "Номера с общей стойкой и правилами",
    icon: Hotel,
  },
  {
    id: "apartment",
    value: "Квартира / апартаменты",
    title: "Квартира или апартаменты",
    description: "Жильё, которое сдаётся целиком",
    icon: KeyRound,
  },
  {
    id: "house",
    value: "Дом / коттедж",
    title: "Дом или коттедж",
    description: "Отдельный дом для проживания гостей",
    icon: House,
  },
] as const;

function getMessage(error: string) {
  switch (error) {
    case "validation":
      return "Выберите тип объекта и заполните название, город и адрес.";
    case "duplicate":
      return "Не удалось создать объект. Попробуйте изменить название.";
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

      <div className="grid max-w-[920px] gap-8 max-[720px]:gap-6">
        <header className="grid max-w-[720px] gap-2">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
            Новый объект
          </p>
          <h1 className="text-[clamp(32px,4vw,46px)] font-semibold leading-[1.04] tracking-[-0.04em] text-[var(--text)]">
            Добавьте объект
          </h1>
          <p className="max-w-[640px] text-sm leading-[1.6] text-[var(--text-muted)]">
            Сначала укажите тип и адрес. Номера, цены, фотографии и правила добавите на следующем шаге.
          </p>
        </header>

        {message ? <InlineNotice tone="error" aria-live="polite">{message}</InlineNotice> : null}

        <form action={createOwnerProperty} className="grid gap-8 max-[720px]:gap-7">
          <input type="hidden" name="published" value="on" />

          <fieldset className="m-0 grid min-w-0 gap-4 border-0 p-0">
            <legend className="mb-1 p-0 text-[22px] font-bold leading-[1.15] tracking-[-0.025em] text-[var(--text)]">
              Что вы добавляете?
            </legend>
            <p className="-mt-2 text-[13px] leading-[1.55] text-[var(--text-muted)]">
              Выберите вариант, который лучше всего описывает объект.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              {propertyTypeOptions.map((option) => {
                const optionId = `property-type-${option.id}`;

                return (
                  <div key={option.value} className="relative min-w-0">
                    <input
                      className="peer sr-only"
                      id={optionId}
                      type="radio"
                      name="propertyType"
                      value={option.value}
                      required
                    />
                    <label
                      htmlFor={optionId}
                      className="grid min-h-[108px] cursor-pointer grid-cols-[44px_minmax(0,1fr)] items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-[border-color,background-color,box-shadow,transform] duration-[180ms] hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.32)] hover:bg-[var(--color-primary-pale)] peer-checked:border-[var(--accent)] peer-checked:bg-[var(--color-primary-pale)] peer-checked:shadow-[0_0_0_3px_rgb(var(--color-primary-rgb)_/_0.10)] peer-focus-visible:border-[var(--accent)] peer-focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.14)] motion-reduce:transition-none"
                    >
                      <span className="grid size-11 place-items-center rounded-[13px] bg-[var(--surface-muted)] text-[var(--accent-strong)]" aria-hidden="true">
                        <AppIcon icon={option.icon} className="size-5" strokeWidth={1.9} />
                      </span>
                      <span className="min-w-0 pt-0.5">
                        <span className="block text-[15px] font-bold leading-[1.3] text-[var(--text)]">{option.title}</span>
                        <span className="mt-1 block text-xs leading-[1.5] text-[var(--text-muted)]">{option.description}</span>
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>

            <p className="text-[13px] leading-[1.55] text-[var(--text-muted)]">
              Сдаёте один номер без объекта?{" "}
              <Link href="/dashboard/rooms/new" className="font-bold text-[var(--accent-strong)] underline decoration-[rgb(var(--color-primary-rgb)_/_0.28)] underline-offset-4 hover:decoration-[var(--accent-strong)]">
                Добавьте отдельный номер
              </Link>
            </p>
          </fieldset>

          <section className="grid gap-4 border-t border-[var(--border)] pt-8 max-[720px]:pt-7" aria-labelledby="new-property-details-title">
            <div className="grid gap-1.5">
              <h2 id="new-property-details-title" className="text-[22px] font-bold leading-[1.15] tracking-[-0.025em] text-[var(--text)]">
                Основные данные
              </h2>
              <p className="text-[13px] leading-[1.55] text-[var(--text-muted)]">
                Эти данные нужны, чтобы создать объект и перейти к настройке номеров.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="property-title"
                name="title"
                label="Название объекта"
                placeholder="Например, гостевой дом «У моря»"
                autoComplete="organization"
                required
                className="min-h-12"
                wrapperClassName="md:col-span-2"
              />
              <Input
                id="property-city"
                name="city"
                label="Город"
                placeholder="Например, Судак"
                autoComplete="address-level2"
                required
                className="min-h-12"
              />
              <Input
                id="property-address"
                name="address"
                label="Адрес"
                placeholder="Улица и номер дома"
                autoComplete="street-address"
                required
                className="min-h-12"
              />
            </div>
          </section>

          <footer className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-6 max-[620px]:grid">
            <p className="max-w-[470px] text-xs leading-[1.55] text-[var(--text-muted)]">
              После создания откроется страница объекта. Там можно добавить номера, фотографии, цены и занятые даты.
            </p>
            <div className="flex shrink-0 gap-3 max-[620px]:grid max-[620px]:w-full">
              <ButtonLink href="/dashboard/properties" variant="secondary" className="max-[620px]:order-2 max-[620px]:w-full">
                Отмена
              </ButtonLink>
              <Button type="submit" className="min-h-11 max-[620px]:order-1 max-[620px]:w-full">
                Продолжить
                <AppIcon icon={ArrowRight} className="size-4" strokeWidth={2.2} aria-hidden="true" />
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </section>
  );
}
