"use client";

import {
  Archive,
  Building2,
  CheckCircle2,
  FileText,
  Home,
  Mail,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import type { OwnerInventoryDashboardData, OwnerInventoryDashboardItem } from "@/entities/property";
import { BottomSheet, ButtonLink, IconButton, Panel, Select } from "@/shared/ui";

import { PropertyCard } from "./property-card";

type PropertyInventoryBrowserProps = {
  data: OwnerInventoryDashboardData;
  feedback?: string | null;
};

type StatusFilter = "all" | "published" | "draft" | "archived";
type SortMode = "newest" | "alphabetical" | "requests" | "activity";

function matchesQuery(item: OwnerInventoryDashboardItem, query: string) {
  if (!query.trim()) {
    return true;
  }

  const haystack = [item.title, item.propertyType, item.city, item.address].join(" ").toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function sortItems(items: OwnerInventoryDashboardItem[], sort: SortMode) {
  const sorted = [...items];

  sorted.sort((left, right) => {
    if (sort === "alphabetical") {
      return left.title.localeCompare(right.title, "ru");
    }

    if (sort === "requests") {
      if (right.newRequestsCount !== left.newRequestsCount) {
        return right.newRequestsCount - left.newRequestsCount;
      }

      return right.createdAt.localeCompare(left.createdAt);
    }

    if (sort === "activity") {
      if (right.activityScore !== left.activityScore) {
        return right.activityScore - left.activityScore;
      }

      return right.createdAt.localeCompare(left.createdAt);
    }

    return right.createdAt.localeCompare(left.createdAt);
  });

  return sorted;
}

function getStatusCards(data: OwnerInventoryDashboardData["summary"]) {
  return [
    { key: "total", label: "Всего объектов", value: data.totalCount, icon: Home, tone: "blue" },
    { key: "published", label: "Опубликовано", value: data.publishedCount, icon: CheckCircle2, tone: "green" },
    { key: "draft", label: "Черновики", value: data.draftCount, icon: FileText, tone: "amber" },
    { key: "archived", label: "Архив", value: data.archivedCount, icon: Archive, tone: "slate" },
    { key: "requests", label: "Новые заявки", value: data.newRequestsCount, icon: Mail, tone: "blue" },
  ];
}

function getSortOptions() {
  return [
    { label: "Сначала новые", value: "newest" },
    { label: "По названию", value: "alphabetical" },
    { label: "По заявкам", value: "requests" },
    { label: "По активности", value: "activity" },
  ];
}

function getStatusOptions() {
  return [
    { label: "Все", value: "all" },
    { label: "Опубликованные", value: "published" },
    { label: "Черновики", value: "draft" },
    { label: "Архив", value: "archived" },
  ];
}

function formatRatioLabel(complete: number, total: number) {
  return `${complete}/${total}`;
}

export function PropertyInventoryBrowser({ data, feedback = null }: PropertyInventoryBrowserProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const filteredItems = useMemo(() => {
    const matches = data.items.filter((item) => {
      if (!matchesQuery(item, query)) {
        return false;
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      return true;
    });

    return sortItems(matches, sort);
  }, [data.items, query, sort, statusFilter]);

  const statusCards = getStatusCards(data.summary);
  const completion = data.rightPanel.completionBreakdown;

  return (
    <div className="br-property-hub">
      <section className="br-property-hub-header br-card">
        <div className="br-property-hub-header__intro">
            <div className="br-property-hub-header__copy">
              <h1>Объекты</h1>
              <p>Управляйте объектами, ссылками и публикацией в одном кабинете владельца.</p>
            </div>

          <div className="br-property-hub-header__mobile-actions">
            <IconButton
              aria-label="Открыть поиск"
              className="br-property-hub-header__icon"
              onClick={() => searchRef.current?.focus()}
            >
              <Search aria-hidden="true" />
            </IconButton>
            <IconButton
              aria-label="Открыть фильтры"
              className="br-property-hub-header__icon"
              onClick={() => setIsFiltersOpen(true)}
            >
              <SlidersHorizontal aria-hidden="true" />
            </IconButton>
          </div>
        </div>

        <div className="br-property-hub-header__toolbar">
          <div className="br-property-hub-header__filters">
            <label className="br-property-hub-filter br-property-hub-filter--search" htmlFor="properties-search">
              <input
                id="properties-search"
                ref={searchRef}
                className="br-field"
                type="search"
                placeholder="Поиск по объектам"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <Select
              id="properties-status"
              wrapperClassName="br-property-hub-filter"
              value={statusFilter}
              options={getStatusOptions()}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            />
            <Select
              id="properties-sort"
              wrapperClassName="br-property-hub-filter"
              value={sort}
              options={getSortOptions()}
              onChange={(event) => setSort(event.target.value as SortMode)}
            />
          </div>

          <div className="br-property-hub-header__cta">
            <ButtonLink href="/dashboard/properties/new">
              <Plus aria-hidden="true" />
              <span>Добавить объект</span>
            </ButtonLink>
          </div>
        </div>

        <div className="br-property-hub-header__mobile-cta">
          <ButtonLink href="/dashboard/properties/new" fullWidth>
            <Plus aria-hidden="true" />
            <span>Добавить объект</span>
          </ButtonLink>
        </div>

        {feedback ? <div className="br-property-hub-feedback">{feedback}</div> : null}
      </section>

      <div className="br-property-hub-stats">
        {statusCards.map((card) => (
          <Panel
            key={card.key}
            as="article"
            className={`br-property-hub-stat-card br-property-hub-stat-card--${card.tone}`}
            padding="md"
          >
            <div className="br-property-hub-stat-card__icon">
              <card.icon aria-hidden="true" />
            </div>
            <div className="br-property-hub-stat-card__copy">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          </Panel>
        ))}
      </div>

      <div className="br-property-hub-layout">
        <div className="br-property-hub-main">
          {filteredItems.length ? (
            <div className="br-property-hub-list">
              {filteredItems.map((item) => (
                <PropertyCard key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <Panel as="section" className="br-property-hub-empty" padding="lg">
              <div className="br-property-hub-empty__icon">
                <Building2 aria-hidden="true" />
              </div>
              <div className="br-property-hub-empty__copy">
                <h2>{data.items.length ? "По этому фильтру ничего не найдено" : "У вас пока нет объектов"}</h2>
                <p>
                  {data.items.length
                    ? "Попробуйте изменить поиск, статус или сортировку, чтобы увидеть нужные карточки."
                    : "Создайте первый объект, добавьте номера и получите публичную ссылку для гостей."}
                </p>
              </div>
              <ButtonLink href="/dashboard/properties/new">Добавить объект</ButtonLink>
            </Panel>
          )}
        </div>

        <aside className="br-property-hub-aside">
          <Panel as="section" className="br-property-hub-side-card" padding="md">
            <div className="br-property-hub-side-card__header">
              <h2>Быстрые действия</h2>
            </div>
            <div className="br-property-hub-side-actions">
              <Link href="/dashboard/properties/new" className="br-property-hub-side-action br-property-hub-side-action--primary">
                <Plus aria-hidden="true" />
                <span>Добавить объект</span>
              </Link>
              <Link href="/dashboard/rooms/new" className="br-property-hub-side-action">
                <span>Создать номер</span>
              </Link>
              <Link href="/dashboard/settings" className="br-property-hub-side-action">
                <span>Открыть публичную страницу</span>
              </Link>
            </div>
          </Panel>

          <Panel as="section" className="br-property-hub-side-card br-property-hub-side-card--hint" padding="md">
            <div className="br-property-hub-side-card__header">
              <h2>Подсказка</h2>
            </div>
            <p>
              Заполните фото и описание, чтобы повысить конверсию и получать больше заявок по вашим ссылкам.
            </p>
          </Panel>

          <Panel as="section" className="br-property-hub-side-card" padding="md">
            <div className="br-property-hub-side-card__header">
              <h2>Заполненность профилей</h2>
              <strong>{data.rightPanel.averageCompletenessPercent}%</strong>
            </div>
            <div className="br-property-hub-completeness">
              <div
                className="br-property-hub-completeness__ring"
                style={{ ["--progress" as string]: String(data.rightPanel.averageCompletenessPercent) }}
              >
                <span>{data.rightPanel.averageCompletenessPercent}%</span>
              </div>
              <div className="br-property-hub-completeness__list">
                <div>
                  <span>Описание и фото</span>
                  <strong>{formatRatioLabel(completion.descriptionAndPhotos.complete, completion.descriptionAndPhotos.total)}</strong>
                </div>
                <div>
                  <span>Удобства и услуги</span>
                  <strong>{formatRatioLabel(completion.amenitiesAndServices.complete, completion.amenitiesAndServices.total)}</strong>
                </div>
                <div>
                  <span>Цены и номера</span>
                  <strong>{formatRatioLabel(completion.pricesAndRooms.complete, completion.pricesAndRooms.total)}</strong>
                </div>
              </div>
            </div>
          </Panel>
        </aside>
      </div>

      <BottomSheet
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        title="Фильтры"
        description="Поиск, статус и сортировка для списка объектов."
        closeLabel="Закрыть фильтры"
        bodyClassName="br-property-hub-sheet"
      >
        {({ close }) => (
          <>
            <label className="br-property-hub-filter br-property-hub-filter--sheet" htmlFor="properties-search-mobile">
              <input
                id="properties-search-mobile"
                className="br-field"
                type="search"
                placeholder="Поиск по объектам"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <Select
              id="properties-status-mobile"
              wrapperClassName="br-property-hub-filter br-property-hub-filter--sheet"
              value={statusFilter}
              options={getStatusOptions()}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            />
            <Select
              id="properties-sort-mobile"
              wrapperClassName="br-property-hub-filter br-property-hub-filter--sheet"
              value={sort}
              options={getSortOptions()}
              onChange={(event) => setSort(event.target.value as SortMode)}
            />
            <button type="button" className="br-button br-button--primary br-button--full" onClick={close}>
              Показать результаты
            </button>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
