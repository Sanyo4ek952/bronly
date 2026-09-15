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
}: CollectionCreateSectionProps) {
  const message = getCollectionFeedbackMessage(success, error);

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
