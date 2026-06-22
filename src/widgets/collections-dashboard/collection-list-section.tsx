import { Layers3, Plus } from "lucide-react";
import Link from "next/link";

import type { CollectionSummary } from "@/entities/collection";
import { buildCollectionSubtitle } from "@/entities/collection";
import { AppIcon, ButtonLink, SectionSubtitle, SectionTitle, StatusPill } from "@/shared/ui";

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
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div className="br-section-copy">
          <SectionTitle>{title}</SectionTitle>
          <SectionSubtitle>{description}</SectionSubtitle>
        </div>
      </div>

      <div className="br-inline-notice br-inline-notice--soft">
        В кабинете показывается базовая статистика по публичной ссылке коллекции: количество открытий и время
        последнего открытия без расширенной аналитики.
      </div>

      <div className="br-collection-create-mobile">
        <ButtonLink href={createHref} fullWidth>
          Создать коллекцию
        </ButtonLink>
      </div>

      <div className="br-collection-grid">
        <Link href={createHref} className="br-collection-create-card br-card br-collection-create-card--desktop">
          <span className="br-collection-create-card__icon" aria-hidden="true">
            <Plus />
          </span>
          <strong>Создать коллекцию</strong>
          <span>Соберите новую подборку для гостя и перейдите к ее настройкам.</span>
        </Link>

        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`${detailHrefBase}/${collection.id}`}
            className="br-collection-card br-card br-collection-card--link"
          >
            <div className="br-collection-card__top">
              <strong>{collection.title}</strong>
              <StatusPill variant={collection.isArchived ? "inactive" : "active"}>
                {collection.isArchived ? "Архив" : "Активна"}
              </StatusPill>
            </div>
            <span>{buildCollectionSubtitle(collection.itemCount, collection.isArchived)}</span>
            <span>Открытия: {collection.viewsCount}</span>
          </Link>
        ))}

        {!collections.length ? (
          <article className="br-empty-card br-card br-collection-grid__empty">
            <div className="br-empty-card__art" aria-hidden="true">
              <AppIcon icon={Layers3} />
            </div>
            <strong>{emptyTitle}</strong>
            <p>{emptyDescription}</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}
