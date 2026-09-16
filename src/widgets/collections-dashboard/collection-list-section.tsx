import { ChevronRight, Info, Layers3, Plus } from "lucide-react";
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
  layout?: "cards" | "owner-list";
};

function formatCollectionCount(count: number) {
  const mod100 = count % 100;
  const mod10 = count % 10;

  if (mod100 >= 11 && mod100 <= 14) return `${count} подборок`;
  if (mod10 === 1) return `${count} подборка`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} подборки`;
  return `${count} подборок`;
}

function formatLastOpenedAt(value: string | null) {
  if (!value) return "Пока не открывали";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function OwnerCollectionList({
  title,
  description,
  collections,
  createHref,
  detailHrefBase,
  emptyTitle,
  emptyDescription,
}: Omit<CollectionListSectionProps, "layout">) {
  const activeCollections = collections.filter((collection) => !collection.isArchived);
  const archivedCollections = collections.filter((collection) => collection.isArchived);
  const totalViews = collections.reduce((sum, collection) => sum + collection.viewsCount, 0);

  const groups = [
    {
      key: "active",
      title: "Активные подборки",
      description: "Их ссылки доступны гостям, пока подборки не отправлены в архив.",
      collections: activeCollections,
    },
    {
      key: "archive",
      title: "Архив",
      description: "Сохранённые подборки, ссылки которых больше не показываются гостям.",
      collections: archivedCollections,
    },
  ];

  return (
    <div className="grid gap-7 max-[720px]:gap-6">
      <header className="flex items-end justify-between gap-8 max-[720px]:grid max-[720px]:items-start max-[720px]:gap-[18px]">
        <div>
          <p className="mb-2 text-[11px] font-extrabold tracking-[0.115em] text-[var(--accent-strong)]">ПОДБОРКИ ДЛЯ ГОСТЕЙ</p>
          <h1 className="text-[clamp(36px,4vw,52px)] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--text)] max-[520px]:text-[32px]">
            {title}
          </h1>
          <SectionSubtitle className="mt-3 max-w-[670px] text-sm leading-[1.55]">{description}</SectionSubtitle>
        </div>
        {collections.length ? (
          <ButtonLink href={createHref} className="min-h-[46px] shrink-0 px-5 max-[720px]:w-full">
            <Plus aria-hidden="true" className="size-[17px]" strokeWidth={2.2} />
            Создать подборку
          </ButtonLink>
        ) : null}
      </header>

      <section className="grid gap-2.5" aria-label="Сводка по подборкам">
        <dl className="grid grid-cols-4 rounded-[23px] bg-[var(--surface-muted)] px-2.5 py-[21px] shadow-[0_14px_38px_rgb(var(--color-primary-rgb)_/_0.06)] max-[700px]:grid-cols-2 max-[700px]:px-[13px] max-[700px]:py-2">
          {[
            ["Всего подборок", collections.length],
            ["Активные", activeCollections.length],
            ["В архиве", archivedCollections.length],
            ["Открытий ссылок", totalViews],
          ].map(([label, value], index) => (
            <div
              key={label}
              className={`min-w-0 border-r border-[rgb(var(--color-primary-rgb)_/_0.18)] px-[22px] last:border-r-0 max-[700px]:px-2.5 max-[700px]:py-[13px] ${
                index === 1 ? "max-[700px]:border-r-0" : ""
              } ${index < 2 ? "max-[700px]:border-b" : ""}`}
            >
              <dd className="text-[29px] font-semibold leading-none text-[var(--text)] max-[700px]:text-[25px]">{value}</dd>
              <dt className="mt-2 text-[11px] text-[var(--text-muted)]">{label}</dt>
            </div>
          ))}
        </dl>
        <p className="mx-1.5 flex items-center gap-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
          <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[var(--surface-subtle)] text-[var(--accent-strong)]" aria-hidden="true">
            <Info className="size-3" strokeWidth={2.2} />
          </span>
          Показываем только базовую статистику: открытия ссылки и время последнего открытия.
        </p>
      </section>

      {collections.length ? (
        groups.map((group) =>
          group.collections.length ? (
            <section key={group.key} className="grid gap-[11px]" aria-labelledby={`owner-collections-${group.key}`}>
              <header className="flex items-end justify-between gap-5 px-0.5 max-[520px]:items-start">
                <div>
                  <h2 id={`owner-collections-${group.key}`} className="text-[21px] font-bold leading-tight tracking-[-0.025em] text-[var(--text)]">
                    {group.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{group.description}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-xs font-extrabold text-[var(--accent-strong)]">
                  {formatCollectionCount(group.collections.length)}
                </span>
              </header>

              <div className="overflow-clip rounded-[23px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_48px_rgb(58_55_48_/_0.08)] max-[700px]:rounded-[20px]">
                {group.collections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`${detailHrefBase}/${collection.id}`}
                    className="group grid min-h-28 grid-cols-[minmax(250px,1.5fr)_minmax(100px,.6fr)_minmax(85px,.45fr)_minmax(140px,.72fr)_24px] items-center gap-[18px] border-b border-[var(--border)] px-[22px] py-5 text-[var(--text)] no-underline transition-colors last:border-b-0 hover:bg-[rgb(var(--color-primary-rgb)_/_0.055)] focus-visible:relative focus-visible:z-[1] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_rgb(var(--color-primary-rgb)_/_0.34)] max-[900px]:grid-cols-[minmax(210px,1.25fr)_minmax(90px,.55fr)_minmax(70px,.4fr)_minmax(130px,.7fr)_20px] max-[900px]:gap-3.5 max-[760px]:min-h-0 max-[760px]:grid-cols-[repeat(3,minmax(0,1fr))_20px] max-[760px]:gap-x-2.5 max-[760px]:gap-y-[15px] max-[760px]:px-4 max-[760px]:py-[18px] max-[340px]:gap-x-[7px] max-[340px]:px-3.5"
                  >
                    <div className="min-w-0 max-[760px]:col-span-4">
                      <div className="flex min-w-0 items-start gap-2.5 max-[760px]:justify-between">
                        <strong className="min-w-0 [overflow-wrap:anywhere] text-base leading-snug max-[340px]:text-[15px]">{collection.title}</strong>
                        <StatusPill variant={collection.isArchived ? "inactive" : "active"}>
                          {collection.isArchived ? "Архив" : "Активна"}
                        </StatusPill>
                      </div>
                      {collection.guestLabel ? (
                        <p className="mt-1.5 [overflow-wrap:anywhere] text-xs leading-relaxed text-[var(--text-muted)]">Для гостя: {collection.guestLabel}</p>
                      ) : null}
                    </div>

                    <div className="min-w-0 max-[760px]:border-r max-[760px]:border-[var(--border)] max-[760px]:pr-2">
                      <span className="block text-[10px] text-[var(--text-muted)]">Варианты</span>
                      <strong className="mt-1 block [overflow-wrap:anywhere] text-xs leading-snug max-[340px]:text-[11px]">
                        {buildCollectionSubtitle(collection.itemCount, false)}
                      </strong>
                    </div>
                    <div className="min-w-0 max-[760px]:border-r max-[760px]:border-[var(--border)] max-[760px]:pr-2">
                      <span className="block text-[10px] text-[var(--text-muted)]">Открытия</span>
                      <strong className="mt-1 block text-xs leading-snug max-[340px]:text-[11px]">{collection.viewsCount}</strong>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] text-[var(--text-muted)]">Последнее</span>
                      <strong className="mt-1 block [overflow-wrap:anywhere] text-xs leading-snug max-[340px]:text-[11px]">
                        {formatLastOpenedAt(collection.lastOpenedAt)}
                      </strong>
                    </div>
                    <ChevronRight
                      aria-hidden="true"
                      className="size-5 justify-self-end text-[var(--accent-strong)] transition-transform group-hover:translate-x-0.5 max-[760px]:col-start-4 max-[760px]:row-start-2"
                      strokeWidth={2}
                    />
                  </Link>
                ))}
              </div>
            </section>
          ) : null,
        )
      ) : (
        <section className="grid justify-items-start gap-[14px] rounded-[23px] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
          <div className="grid size-14 place-items-center rounded-[18px] bg-[var(--surface-muted)] text-[var(--accent-strong)]" aria-hidden="true">
            <AppIcon icon={Layers3} />
          </div>
          <div className="grid gap-2">
            <h2 className="text-xl font-bold leading-tight text-[var(--text)]">{emptyTitle}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">{emptyDescription}</p>
          </div>
          <ButtonLink href={createHref} className="max-[520px]:w-full">
            <Plus aria-hidden="true" className="size-[17px]" strokeWidth={2.2} />
            Создать подборку
          </ButtonLink>
        </section>
      )}
    </div>
  );
}

export function CollectionListSection({
  title,
  description,
  collections,
  createHref,
  detailHrefBase,
  emptyTitle,
  emptyDescription,
  layout = "cards",
}: CollectionListSectionProps) {
  if (layout === "owner-list") {
    return (
      <OwnerCollectionList
        title={title}
        description={description}
        collections={collections}
        createHref={createHref}
        detailHrefBase={detailHrefBase}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    );
  }

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
