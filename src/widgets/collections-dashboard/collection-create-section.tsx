import { ArrowUpRight } from "lucide-react";

import { Button, ButtonLink, InlineNotice, Input, Panel, SectionSubtitle, SectionTitle } from "@/shared/ui";

import { getCollectionFeedbackMessage } from "./collection-feedback";

type CollectionAction = (formData: FormData) => Promise<void>;

type CollectionCreateSectionProps = {
  title: string;
  description: string;
  fieldPlaceholder: string;
  backHref: string;
  pageNav?: React.ReactNode;
  action: CollectionAction;
  success?: string;
  error?: string;
  layout?: "default" | "owner-create";
};

export function CollectionCreateSection({
  title,
  description,
  fieldPlaceholder,
  backHref,
  pageNav = null,
  action,
  success = "",
  error = "",
  layout = "default",
}: CollectionCreateSectionProps) {
  const message = getCollectionFeedbackMessage(success, error);

  if (layout === "owner-create") {
    return (
      <div className="grid gap-6 max-[720px]:gap-5">
        {pageNav}

        <header>
          <p className="mb-2 text-[11px] font-extrabold tracking-[0.115em] text-[var(--accent-strong)]">НОВАЯ ПОДБОРКА</p>
          <h1 className="max-w-[760px] [overflow-wrap:anywhere] text-[clamp(36px,4vw,52px)] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--text)] max-[520px]:text-[32px]">
            {title}
          </h1>
          <p className="mt-3 max-w-[690px] [overflow-wrap:anywhere] text-sm leading-[1.58] text-[var(--text-muted)]">{description}</p>
        </header>

        {message ? <InlineNotice>{message}</InlineNotice> : null}

        <form action={action}>
          <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] max-[520px]:rounded-[20px]" aria-labelledby="owner-collection-create-title">
            <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(230px,.8fr)] max-[760px]:grid-cols-1">
              <div className="min-w-0 p-7 max-[720px]:p-[18px] max-[340px]:p-[14px]">
                <h2 id="owner-collection-create-title" className="text-[21px] font-bold leading-tight tracking-[-0.025em] text-[var(--text)]">
                  Название подборки
                </h2>
                <p className="mt-1.5 [overflow-wrap:anywhere] text-[13px] leading-[1.55] text-[var(--text-muted)]">
                  Внутреннее название поможет быстро найти подборку в кабинете.
                </p>

                <div className="mt-6 grid max-w-[610px] gap-[18px]">
                  <Input
                    id="collection-title"
                    name="title"
                    label="Название в кабинете"
                    placeholder={fieldPlaceholder}
                    wrapperClassName="min-w-0 [overflow-wrap:anywhere]"
                    maxLength={120}
                    required
                  />
                  <Input
                    id="collection-guest-label"
                    name="guestLabel"
                    label="Название для гостя"
                    placeholder="Например, Варианты для Анны"
                    description="Необязательно. Если оставить пустым, гость увидит название из кабинета."
                    wrapperClassName="min-w-0 [overflow-wrap:anywhere]"
                    maxLength={160}
                  />
                </div>
              </div>

              <aside className="min-w-0 rounded-tr-[23px] border-l border-[rgb(var(--color-primary-rgb)_/_0.14)] bg-[var(--surface-muted)] px-[26px] py-7 max-[760px]:rounded-none max-[760px]:border-l-0 max-[760px]:border-t max-[760px]:px-[18px] max-[760px]:py-[21px] max-[340px]:px-[14px]" aria-labelledby="owner-collection-next-title">
                <span className="grid size-[42px] place-items-center rounded-[14px] bg-[var(--color-primary-soft)] text-[var(--accent-strong)]" aria-hidden="true">
                  <ArrowUpRight className="size-[19px]" strokeWidth={2.1} />
                </span>
                <h3 id="owner-collection-next-title" className="mt-[18px] text-base font-bold text-[var(--text)]">Что дальше</h3>
                <p className="mt-2 [overflow-wrap:anywhere] text-xs leading-[1.6] text-[var(--text-muted)]">
                  После создания откроется страница подборки. Там можно добавить объекты и отдельные номера, затем отправить гостю готовую ссылку.
                </p>
                <ol className="mt-[19px] grid gap-2.5 [counter-reset:collection-step]">
                  {["Создайте пустую подборку.", "Добавьте нужные варианты.", "Проверьте и отправьте ссылку."].map((step) => (
                    <li key={step} className="grid min-w-0 grid-cols-[22px_minmax(0,1fr)] items-start gap-2.5 [counter-increment:collection-step] [overflow-wrap:anywhere] text-[11px] leading-[1.45] text-[var(--text-muted)] before:grid before:size-[22px] before:place-items-center before:rounded-full before:bg-[var(--surface)] before:text-[10px] before:font-extrabold before:text-[var(--accent-strong)] before:content-[counter(collection-step)]">
                      {step}
                    </li>
                  ))}
                </ol>
              </aside>
            </div>

            <footer className="flex justify-end gap-3 rounded-b-[23px] border-t border-[var(--border)] bg-[var(--surface-subtle)] px-7 py-[18px] max-[720px]:grid max-[720px]:px-[18px] max-[720px]:pb-[18px] max-[720px]:pt-4 max-[340px]:px-[14px] max-[340px]:pb-[14px]">
              <ButtonLink href={backHref} variant="secondary" className="max-[720px]:order-2 max-[720px]:w-full">
                Вернуться к списку
              </ButtonLink>
              <Button type="submit" className="max-[720px]:order-1 max-[720px]:w-full">
                Создать подборку
                <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
              </Button>
            </footer>
          </section>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {pageNav}

      <Panel className="grid gap-5" padding="lg">
        <div className="grid gap-1.5">
          <SectionTitle>{title}</SectionTitle>
          <SectionSubtitle>{description}</SectionSubtitle>
        </div>

        {message ? <InlineNotice>{message}</InlineNotice> : null}

        <form action={action}>
          <Panel className="grid gap-5" padding="lg" surface="subtle">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-1">
              <strong>Новая коллекция</strong>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">Внутреннее название помогает найти коллекцию, а название для гостя показывается по публичной ссылке.</p>
            </div>
            <ButtonLink href={backHref} variant="secondary">
              К списку коллекций
            </ButtonLink>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input id="collection-title" name="title" label="Название в кабинете" placeholder={fieldPlaceholder} maxLength={120} required />
            <Input
              id="collection-guest-label"
              name="guestLabel"
              label="Название для гостя"
              placeholder="Например, Варианты для Анны"
              description="Необязательно. Если оставить пустым, гость увидит название из кабинета."
              maxLength={160}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Создать коллекцию</Button>
          </div>
          </Panel>
        </form>
      </Panel>
    </div>
  );
}
