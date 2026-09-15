import { Layers3, Plus } from "lucide-react";
import Link from "next/link";

import { buildCollectionSubtitle, type CollectionSummary } from "@/entities/collection";
import { AppIcon, ButtonLink, InlineNotice, Panel, SectionSubtitle, SectionTitle, StatusPill } from "@/shared/ui";

type CollectionListSectionProps = {
  title: string;
  description: string;
  collections: CollectionSummary[];
  createHref: string;
  detailHrefBase: string;
  emptyTitle: string;
  emptyDescription: string;
};

export function CollectionListSection({
  title,
  description,
  collections,
  createHref,
  detailHrefBase,
  emptyTitle,
  emptyDescription,
}: CollectionListSectionProps) {
  return (
    <Panel className="grid gap-5" padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <SectionTitle>{title}</SectionTitle>
          <SectionSubtitle>{description}</SectionSubtitle>
        </div>
        <ButtonLink href={createHref} className="max-md:hidden">
          Создать коллекцию
        </ButtonLink>
      </div>

      <InlineNotice tone="soft">
        Базовая статистика показывает количество открытий публичной ссылки и время последнего открытия без расширенной аналитики.
      </InlineNotice>

      <ButtonLink href={createHref} fullWidth className="md:hidden">
        Создать коллекцию
      </ButtonLink>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          href={createHref}
          className="group hidden min-h-44 place-items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)] p-5 text-center text-[var(--text)] no-underline transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.34)] hover:bg-[var(--color-primary-pale)] md:grid"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--accent)]" aria-hidden="true">
            <AppIcon icon={Plus} />
          </span>
          <strong className="text-base">Создать коллекцию</strong>
          <span className="text-sm leading-relaxed text-[var(--text-muted)]">Соберите новую подборку для гостя и перейдите к её настройкам.</span>
        </Link>

        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`${detailHrefBase}/${collection.id}`}
            className="grid min-h-44 content-between gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] no-underline shadow-[var(--shadow-sm)] transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <strong className="text-base leading-snug">{collection.title}</strong>
                {collection.guestLabel ? <span className="text-sm text-[var(--text-muted)]">Для гостя: {collection.guestLabel}</span> : null}
              </div>
              <StatusPill variant={collection.isArchived ? "inactive" : "active"}>
                {collection.isArchived ? "Архив" : "Активна"}
              </StatusPill>
            </div>
            <div className="grid gap-1 text-sm text-[var(--text-muted)]">
              <span>{buildCollectionSubtitle(collection.itemCount, collection.isArchived)}</span>
              <span>Открытия: {collection.viewsCount}</span>
            </div>
          </Link>
        ))}

        {!collections.length ? (
          <Panel as="article" className="grid min-h-44 place-items-center gap-2 text-center sm:col-span-2" padding="lg" surface="subtle">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--accent)]" aria-hidden="true">
              <AppIcon icon={Layers3} />
            </div>
            <strong>{emptyTitle}</strong>
            <p className="max-w-md text-sm leading-relaxed text-[var(--text-muted)]">{emptyDescription}</p>
          </Panel>
        ) : null}
      </div>
    </Panel>
  );
}
