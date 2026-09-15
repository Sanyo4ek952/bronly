"use client";

import { Archive, CheckCircle2, FileText, Home, Mail, Plus, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import type { OwnerInventoryDashboardData, OwnerInventoryDashboardItem } from "@/entities/property";
import { cn } from "@/shared/lib/cn";
import { BottomSheet, Button, ButtonLink, IconButton, InlineNotice, Input, Select } from "@/shared/ui";

import { PropertyCard } from "./property-card";

type PropertyInventoryBrowserProps = {
  data: OwnerInventoryDashboardData;
  feedback?: string | null;
  feedbackTone?: "default" | "error";
};

type StatusFilter = "all" | "published" | "draft" | "archived";
type SortMode = "newest" | "alphabetical" | "requests" | "activity";

const statusOptions = [
  { label: "Все статусы", value: "all" },
  { label: "Опубликованные", value: "published" },
  { label: "Черновики", value: "draft" },
  { label: "Архив", value: "archived" },
];

const sortOptions = [
  { label: "Сначала новые", value: "newest" },
  { label: "По названию", value: "alphabetical" },
  { label: "По заявкам", value: "requests" },
  { label: "По активности", value: "activity" },
];

function matchesQuery(item: OwnerInventoryDashboardItem, query: string) {
  if (!query.trim()) return true;
  const haystack = [item.title, item.propertyType, item.city, item.address].join(" ").toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function sortItems(items: OwnerInventoryDashboardItem[], sort: SortMode) {
  return [...items].sort((left, right) => {
    if (sort === "alphabetical") return left.title.localeCompare(right.title, "ru");
    if (sort === "requests") return right.newRequestsCount - left.newRequestsCount || right.createdAt.localeCompare(left.createdAt);
    if (sort === "activity") return right.activityScore - left.activityScore || right.createdAt.localeCompare(left.createdAt);
    return right.createdAt.localeCompare(left.createdAt);
  });
}

function getSummaryItems(data: OwnerInventoryDashboardData["summary"]) {
  return [
    { key: "total", label: "Всего вариантов", value: data.totalCount, icon: Home },
    { key: "published", label: "Опубликовано", value: data.publishedCount, icon: CheckCircle2 },
    { key: "draft", label: "Черновики", value: data.draftCount, icon: FileText },
    { key: "archived", label: "В архиве", value: data.archivedCount, icon: Archive },
    { key: "requests", label: "Новые заявки", value: data.newRequestsCount, icon: Mail },
  ];
}

function formatCount(count: number, one: string, few: string, many: string) {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} ${many}`;
  if (mod10 === 1) return `${count} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} ${few}`;
  return `${count} ${many}`;
}

function InventoryGroup({ items, kind }: { items: OwnerInventoryDashboardItem[]; kind: "property" | "standalone_room" }) {
  if (!items.length) return null;
  const isProperty = kind === "property";

  return (
    <section aria-labelledby={`inventory-${kind}-title`}>
      <header className="mb-3 flex items-end justify-between gap-4 max-[520px]:items-start">
        <div className="grid gap-1">
          <h2 id={`inventory-${kind}-title`} className="text-[21px] font-bold leading-tight tracking-[-0.025em] text-[var(--text)]">
            {isProperty ? "Объекты" : "Самостоятельные номера"}
          </h2>
          <p className="text-xs text-[var(--text-muted)] max-[520px]:hidden">
            {isProperty ? "Варианты размещения, внутри которых есть номера" : "Номера со своим адресом, не привязанные к объекту"}
          </p>
        </div>
        <span className="shrink-0 text-xs font-extrabold text-[var(--accent-strong)]">
          {isProperty ? formatCount(items.length, "объект", "объекта", "объектов") : formatCount(items.length, "номер", "номера", "номеров")}
        </span>
      </header>
      <div className="grid gap-[14px]">
        {items.map((item) => <PropertyCard key={`${item.kind}-${item.id}`} item={item} />)}
      </div>
    </section>
  );
}

function ReadinessAside({ data }: { data: OwnerInventoryDashboardData["rightPanel"] }) {
  const rows: Array<[string, { complete: number; total: number }]> = [
    ["Описание и фото", data.completionBreakdown.descriptionAndPhotos],
    ["Удобства и услуги", data.completionBreakdown.amenitiesAndServices],
    ["Цены и номера", data.completionBreakdown.pricesAndRooms],
  ];

  return (
    <aside className="sticky top-6 rounded-[22px] bg-[var(--surface)] p-[21px] shadow-[var(--shadow-md)] max-[1180px]:hidden">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[19px] font-bold leading-tight tracking-[-0.02em] text-[var(--text)]">Готовность витрины</h2>
        <strong className="text-2xl font-bold text-[var(--accent-strong)]">{data.averageCompletenessPercent}%</strong>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-subtle)]" aria-hidden="true">
        <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${data.averageCompletenessPercent}%` }} />
      </div>
      <p className="mb-3 mt-2 text-[11px] text-[var(--text-muted)]">Средняя заполненность объектов и номеров</p>
      {rows.map(([label, ratio]) => (
        <div key={label} className="flex justify-between gap-3 border-t border-[var(--border)] py-3 text-xs">
          <span className="text-[var(--text-muted)]">{label}</span>
          <strong className="text-[var(--text)]">{ratio.complete}/{ratio.total}</strong>
        </div>
      ))}
      <ButtonLink href="/dashboard/settings" variant="ghost" className="mt-1 justify-start px-0 !text-[var(--accent-strong)]">
        Открыть публичную страницу →
      </ButtonLink>
    </aside>
  );
}

export function PropertyInventoryBrowser({ data, feedback = null, feedbackTone = "default" }: PropertyInventoryBrowserProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const filteredItems = useMemo(() => sortItems(data.items.filter((item) => {
    return matchesQuery(item, query) && (statusFilter === "all" || item.status === statusFilter);
  }), sort), [data.items, query, sort, statusFilter]);
  const propertyItems = filteredItems.filter((item) => item.kind === "property");
  const standaloneItems = filteredItems.filter((item) => item.kind === "standalone_room");
  const hasActiveFilters = Boolean(query.trim()) || statusFilter !== "all";

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setSort("newest");
  }

  return (
    <div className="grid gap-6 max-[720px]:gap-5">
      <header className="flex items-end justify-between gap-7 max-[720px]:grid max-[720px]:items-start">
        <div>
          <p className="mb-1.5 text-[11px] font-extrabold tracking-[0.11em] text-[var(--accent-strong)]">ИНВЕНТАРЬ ВЛАДЕЛЬЦА</p>
          <h1 className="text-[clamp(32px,3.5vw,46px)] font-semibold leading-[1.05] tracking-[-0.045em] text-[var(--text)] max-[520px]:text-[30px]">Объекты и номера</h1>
          <p className="mt-2.5 max-w-[650px] text-sm text-[var(--text-muted)]">Управляйте вариантами размещения, их готовностью и показом гостям.</p>
        </div>
        <div className="flex shrink-0 gap-2.5 max-[720px]:grid max-[720px]:w-full max-[720px]:grid-cols-2 max-[420px]:grid-cols-1">
          <ButtonLink href="/dashboard/rooms/new" variant="secondary" className="min-h-[46px] px-[18px]">Отдельный номер</ButtonLink>
          <ButtonLink href="/dashboard/properties/new" className="min-h-[46px] px-[18px]"><Plus aria-hidden="true" className="size-[18px]" strokeWidth={2.2} />Добавить объект</ButtonLink>
        </div>
      </header>

      {feedback ? <InlineNotice tone={feedbackTone}>{feedback}</InlineNotice> : null}

      <section className="grid grid-cols-5 rounded-[24px] bg-[var(--surface-muted)] px-2 py-[22px] shadow-[0_14px_38px_rgb(var(--color-primary-rgb)_/_0.06)] max-[720px]:grid-cols-2 max-[720px]:px-[14px] max-[720px]:py-2" aria-label="Сводка по объектам и номерам">
        {getSummaryItems(data.summary).map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className={cn("border-r border-[rgb(var(--color-primary-rgb)_/_0.18)] px-5 last:border-r-0", "max-[720px]:border-b max-[720px]:px-2.5 max-[720px]:py-3", index % 2 === 1 && "max-[720px]:border-r-0", index >= 2 && index < 4 && "max-[720px]:border-b-0", item.key === "requests" && "max-[720px]:col-span-2 max-[720px]:border-t max-[720px]:border-r-0 max-[720px]:border-b-0") }>
              <div className="flex items-center gap-2"><Icon aria-hidden="true" className="size-4 text-[var(--accent-strong)]" strokeWidth={2} /><strong className="text-[28px] font-semibold leading-none text-[var(--text)] max-[720px]:text-2xl">{item.value}</strong></div>
              <span className="mt-2 block text-[11px] text-[var(--text-subtle)]">{item.label}</span>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-[minmax(220px,1fr)_180px_190px] gap-2.5 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)] max-[720px]:grid-cols-[minmax(0,1fr)_44px] max-[720px]:p-2" aria-label="Поиск и фильтры">
        <Input id="properties-search" type="search" aria-label="Поиск по объектам и номерам" placeholder="Название, город или адрес" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 bg-[var(--bg)]" />
        <Select id="properties-status" aria-label="Статус" options={statusOptions} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="min-h-11 bg-[var(--bg)] max-[720px]:hidden" />
        <Select id="properties-sort" aria-label="Сортировка" options={sortOptions} value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="min-h-11 bg-[var(--bg)] max-[720px]:hidden" />
        <IconButton type="button" aria-label="Открыть фильтры" aria-expanded={isFiltersOpen} className="hidden size-11 rounded-[13px] bg-[var(--bg)] shadow-none max-[720px]:grid" onClick={() => setIsFiltersOpen(true)}><SlidersHorizontal aria-hidden="true" className="size-[18px]" strokeWidth={2} /></IconButton>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_272px] items-start gap-[30px] max-[1180px]:grid-cols-1">
        <div className="grid gap-7">
          {filteredItems.length ? <><InventoryGroup items={propertyItems} kind="property" /><InventoryGroup items={standaloneItems} kind="standalone_room" /></> : (
            <section className="grid justify-items-start gap-[14px] rounded-[22px] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
              <div className="grid size-14 place-items-center rounded-[18px] bg-[var(--surface-muted)] text-[var(--accent-strong)]"><Home aria-hidden="true" className="size-7" strokeWidth={2} /></div>
              <div className="grid gap-2"><h2 className="text-xl font-bold leading-tight text-[var(--text)]">{data.items.length ? "По этому фильтру ничего не найдено" : "У вас пока нет объектов и номеров"}</h2><p className="max-w-2xl text-sm text-[var(--text-muted)]">{data.items.length ? "Измените запрос или статус, чтобы увидеть нужные варианты." : "Создайте объект с номерами или самостоятельный номер и получите публичную ссылку для гостей."}</p></div>
              {hasActiveFilters ? <Button variant="secondary" onClick={resetFilters}>Сбросить фильтры</Button> : <div className="flex flex-wrap gap-2.5 max-[420px]:grid max-[420px]:w-full"><ButtonLink href="/dashboard/properties/new">Добавить объект</ButtonLink><ButtonLink href="/dashboard/rooms/new" variant="secondary">Создать отдельный номер</ButtonLink></div>}
            </section>
          )}
        </div>
        <ReadinessAside data={data.rightPanel} />
      </div>

      <BottomSheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen} title="Фильтры" description="Выберите статус и порядок списка. Поиск остаётся доступен на странице." closeLabel="Закрыть фильтры" rootClassName="min-[721px]:hidden">
        {({ close }) => <><Select id="properties-status-mobile" label="Статус" options={statusOptions} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="min-h-11" /><Select id="properties-sort-mobile" label="Сортировка" options={sortOptions} value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="min-h-11" /><Button fullWidth onClick={close}>Показать результаты</Button></>}
      </BottomSheet>
    </div>
  );
}
