"use client";

import {
  Archive,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileText,
  Home,
  Mail,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";
import type { OwnerInventoryDashboardData, OwnerInventoryDashboardItem } from "@/entities/property";
import { BottomSheet, InlineNotice } from "@/shared/ui";

import { PropertyCard } from "./property-card";
import {
  inventoryFieldClass,
  inventoryGradientButtonClass,
  inventoryIconButtonClass,
  inventoryPrimaryButtonClass,
  inventorySecondaryButtonClass,
  inventorySelectClass,
} from "./property-inventory-ui";

type PropertyInventoryBrowserProps = {
  data: OwnerInventoryDashboardData;
  feedback?: string | null;
  feedbackTone?: "default" | "error";
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
    { key: "total", label: "Всего вариантов", value: data.totalCount, icon: Home, tone: "blue" as const },
    { key: "published", label: "Опубликовано", value: data.publishedCount, icon: CheckCircle2, tone: "green" as const },
    { key: "draft", label: "Черновики", value: data.draftCount, icon: FileText, tone: "amber" as const },
    { key: "archived", label: "Архив", value: data.archivedCount, icon: Archive, tone: "slate" as const },
    { key: "requests", label: "Новые заявки", value: data.newRequestsCount, icon: Mail, tone: "blue" as const },
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

function SelectControl(props: {
  id: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative min-w-0">
      <select
        id={props.id}
        className={inventorySelectClass}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
        strokeWidth={2}
      />
    </div>
  );
}

function getStatCardToneClass(tone: "blue" | "green" | "amber" | "slate") {
  switch (tone) {
    case "green":
      return "bg-[rgb(34_197_94_/_0.12)] text-[rgb(22_163_74)]";
    case "amber":
      return "bg-[rgb(245_158_11_/_0.13)] text-[rgb(217_119_6)]";
    case "slate":
      return "bg-[rgb(148_163_184_/_0.14)] text-[rgb(100_116_139)]";
    default:
      return "bg-[rgb(37_99_235_/_0.12)] text-[rgb(29_78_216)]";
  }
}

export function PropertyInventoryBrowser({ data, feedback = null, feedbackTone = "default" }: PropertyInventoryBrowserProps) {
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
    <div className="grid gap-4 max-[520px]:gap-3">
      <section
        className={cn(
          "grid gap-[18px] rounded-[28px] border border-[rgb(var(--color-primary-rgb)_/_0.10)] px-[22px] py-[22px]",
          "bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_250_/_0.96))] [box-shadow:var(--shadow-sm)]",
          "max-[720px]:px-4 max-[720px]:py-[18px]",
        )}
      >
        <div className="flex items-start justify-between gap-4 max-[720px]:items-center">
          <div className="grid gap-2">
            <div className="grid gap-2">
              <h1 className="text-[clamp(28px,4vw,32px)] leading-[1.02] tracking-[-0.04em] text-[var(--text)] max-[520px]:text-2xl">
                Объекты и номера
              </h1>
              <p className="max-w-[680px] text-[var(--text-muted)] max-[720px]:hidden">
                Управляйте объектами, отдельными номерами, ссылками и публикацией в одном кабинете владельца.
              </p>
            </div>
          </div>

          <div className="hidden gap-2 max-[720px]:inline-flex">
            <button
              type="button"
              aria-label="Открыть поиск"
              className={inventoryIconButtonClass}
              onClick={() => searchRef.current?.focus()}
            >
              <Search aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Открыть фильтры"
              className={inventoryIconButtonClass}
              onClick={() => setIsFiltersOpen(true)}
            >
              <SlidersHorizontal aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="flex min-w-0 items-start justify-between gap-4 max-[1280px]:grid max-[720px]:hidden">
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(240px,1.25fr)_repeat(2,minmax(160px,0.42fr))] gap-3">
            <label className="min-w-0" htmlFor="properties-search">
              <input
                id="properties-search"
                ref={searchRef}
                className={inventoryFieldClass}
                type="search"
                placeholder="Поиск по объектам"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <SelectControl
              id="properties-status"
              value={statusFilter}
              options={getStatusOptions()}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
            />

            <SelectControl
              id="properties-sort"
              value={sort}
              options={getSortOptions()}
              onChange={(value) => setSort(value as SortMode)}
            />
          </div>

          <div className="flex shrink-0 justify-end gap-2.5">
            <Link href="/dashboard/rooms/new" className={cn(inventorySecondaryButtonClass, "min-h-11")}>Отдельный номер</Link>
            <Link href="/dashboard/properties/new" className={cn(inventoryPrimaryButtonClass, "min-h-11 gap-2.5 px-[18px]")}>
              <Plus aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
              <span>Добавить объект</span>
            </Link>
          </div>
        </div>

        <div className="hidden gap-2.5 max-[720px]:grid max-[720px]:grid-cols-2 max-[420px]:grid-cols-1">
          <Link href="/dashboard/properties/new" className={cn(inventoryPrimaryButtonClass, "w-full")}>
            <Plus aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
            <span>Добавить объект</span>
          </Link>
          <Link href="/dashboard/rooms/new" className={cn(inventorySecondaryButtonClass, "w-full")}>Отдельный номер</Link>
        </div>

        {feedback ? <InlineNotice tone={feedbackTone}>{feedback}</InlineNotice> : null}
      </section>

      <div className="grid grid-cols-5 gap-3 max-[960px]:grid-cols-2 max-[720px]:grid-cols-2 max-[520px]:gap-3">
        {statusCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.key}
              className={cn(
                "grid min-h-[78px] grid-cols-[40px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-[14px] py-3 [box-shadow:var(--shadow-sm)]",
                "max-[720px]:min-h-[74px] max-[720px]:grid-cols-[36px_minmax(0,1fr)] max-[720px]:px-3 max-[720px]:py-3",
                "max-[520px]:min-h-[88px] max-[520px]:grid-cols-[42px_minmax(0,1fr)] max-[520px]:px-[14px] max-[520px]:py-[14px]",
                card.key === "requests" && "max-[720px]:col-span-2",
              )}
            >
              <div
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl max-[720px]:h-9 max-[720px]:w-9 max-[520px]:h-[42px] max-[520px]:w-[42px] max-[520px]:rounded-[14px]",
                  getStatCardToneClass(card.tone),
                )}
              >
                <Icon aria-hidden="true" className="h-5 w-5 max-[720px]:h-[18px] max-[720px]:w-[18px]" strokeWidth={2} />
              </div>
              <div className="grid min-w-0 gap-1.5">
                <span className="text-xs font-medium leading-[1.25] text-[var(--text-muted)]">{card.label}</span>
                <strong className="text-[26px] leading-none text-[var(--text)] max-[720px]:text-2xl max-[520px]:text-2xl">
                  {card.value}
                </strong>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-4 max-[1180px]:grid-cols-1">
        <div className="grid gap-4 max-[520px]:gap-3">
          {filteredItems.length ? (
            <div className="grid gap-4 max-[520px]:gap-3">
              {filteredItems.map((item) => (
                <PropertyCard key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <section className="grid justify-items-start gap-[14px] rounded-3xl border border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[var(--surface)] px-6 py-6 [box-shadow:var(--shadow-sm)]">
              <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-[var(--color-primary-hover)]">
                <Building2 aria-hidden="true" className="h-7 w-7" strokeWidth={2} />
              </div>
              <div className="grid gap-2">
                <h2 className="text-xl font-bold leading-[1.15] text-[var(--text)]">
                  {data.items.length ? "По этому фильтру ничего не найдено" : "У вас пока нет объектов и номеров"}
                </h2>
                <p className="text-[var(--text-muted)]">
                  {data.items.length
                    ? "Попробуйте изменить поиск, статус или сортировку, чтобы увидеть нужные карточки."
                    : "Создайте объект с номерами или отдельный номер и получите публичную ссылку для гостей."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link href="/dashboard/properties/new" className={inventoryPrimaryButtonClass}>Добавить объект</Link>
                <Link href="/dashboard/rooms/new" className={inventorySecondaryButtonClass}>Создать отдельный номер</Link>
              </div>
            </section>
          )}
        </div>

        <aside className="grid gap-4 max-[1180px]:grid-cols-3 max-[960px]:grid-cols-2 max-[720px]:hidden">
          <section
            className={cn(
              "grid gap-[14px] rounded-3xl border border-[rgb(var(--color-primary-rgb)_/_0.10)] px-[18px] py-[18px]",
              "bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_250_/_0.96))] [box-shadow:var(--shadow-sm)]",
            )}
          >
            <div className="flex items-center justify-between gap-2.5">
              <h2 className="text-lg font-bold leading-[1.15] text-[var(--text)]">Быстрые действия</h2>
            </div>
            <div className="grid gap-2.5">
              <Link href="/dashboard/properties/new" className={inventoryGradientButtonClass}>
                <Plus aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
                <span>Добавить объект</span>
              </Link>
              <Link href="/dashboard/rooms/new" className={inventorySecondaryButtonClass}>
                <span>Создать номер</span>
              </Link>
              <Link href="/dashboard/settings" className={inventorySecondaryButtonClass}>
                <span>Открыть публичную страницу</span>
              </Link>
            </div>
          </section>

          <section
            className={cn(
              "grid gap-[14px] rounded-3xl border border-[rgb(var(--color-primary-rgb)_/_0.10)] px-[18px] py-[18px]",
              "bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_250_/_0.96))] [box-shadow:var(--shadow-sm)]",
            )}
          >
            <div className="flex items-center justify-between gap-2.5">
              <h2 className="text-lg font-bold leading-[1.15] text-[var(--text)]">Подсказка</h2>
            </div>
            <p className="text-[var(--text-muted)]">
              Заполните фото и описание, чтобы повысить конверсию и получать больше заявок по вашим ссылкам.
            </p>
          </section>

          <section
            className={cn(
              "grid gap-[14px] rounded-3xl border border-[rgb(var(--color-primary-rgb)_/_0.10)] px-[18px] py-[18px]",
              "bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_250_/_0.96))] [box-shadow:var(--shadow-sm)]",
            )}
          >
            <div className="flex items-center justify-between gap-2.5">
              <h2 className="text-lg font-bold leading-[1.15] text-[var(--text)]">Заполненность профилей</h2>
              <strong className="text-xl font-bold text-[var(--color-primary-hover)]">
                {data.rightPanel.averageCompletenessPercent}%
              </strong>
            </div>
            <div className="grid grid-cols-[108px_minmax(0,1fr)] items-center gap-[14px]">
              <div
                className="grid h-[108px] w-[108px] place-items-center rounded-full shadow-[inset_0_0_0_1px_rgb(var(--color-primary-rgb)_/_0.10)]"
                style={{
                  background: `radial-gradient(circle at center, #fff 0 42px, transparent 43px), conic-gradient(var(--color-primary) ${data.rightPanel.averageCompletenessPercent}%, rgb(var(--color-primary-rgb) / 12%) 0)`,
                }}
              >
                <span className="text-xl font-extrabold text-[var(--color-primary-hover)]">
                  {data.rightPanel.averageCompletenessPercent}%
                </span>
              </div>

              <div className="grid gap-2.5">
                <div className="flex min-h-[42px] items-center justify-between gap-3 rounded-[14px] border border-[var(--color-border)] bg-[rgb(248_250_250_/_0.9)] px-[14px]">
                  <span className="text-[13px] text-[var(--text-muted)]">Описание и фото</span>
                  <strong className="text-[13px] text-[var(--text)]">
                    {formatRatioLabel(completion.descriptionAndPhotos.complete, completion.descriptionAndPhotos.total)}
                  </strong>
                </div>
                <div className="flex min-h-[42px] items-center justify-between gap-3 rounded-[14px] border border-[var(--color-border)] bg-[rgb(248_250_250_/_0.9)] px-[14px]">
                  <span className="text-[13px] text-[var(--text-muted)]">Удобства и услуги</span>
                  <strong className="text-[13px] text-[var(--text)]">
                    {formatRatioLabel(completion.amenitiesAndServices.complete, completion.amenitiesAndServices.total)}
                  </strong>
                </div>
                <div className="flex min-h-[42px] items-center justify-between gap-3 rounded-[14px] border border-[var(--color-border)] bg-[rgb(248_250_250_/_0.9)] px-[14px]">
                  <span className="text-[13px] text-[var(--text-muted)]">Цены и номера</span>
                  <strong className="text-[13px] text-[var(--text)]">
                    {formatRatioLabel(completion.pricesAndRooms.complete, completion.pricesAndRooms.total)}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <BottomSheet
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        title="Фильтры"
        description="Поиск, статус и сортировка для списка объектов."
        closeLabel="Закрыть фильтры"
        rootClassName="min-[721px]:hidden"
      >
        {({ close }) => (
          <>
            <label className="min-w-0" htmlFor="properties-search-mobile">
              <input
                id="properties-search-mobile"
                className={inventoryFieldClass}
                type="search"
                placeholder="Поиск по объектам"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <SelectControl
              id="properties-status-mobile"
              value={statusFilter}
              options={getStatusOptions()}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
            />
            <SelectControl
              id="properties-sort-mobile"
              value={sort}
              options={getSortOptions()}
              onChange={(value) => setSort(value as SortMode)}
            />
            <button type="button" className={cn(inventoryPrimaryButtonClass, "w-full")} onClick={close}>
              Показать результаты
            </button>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
