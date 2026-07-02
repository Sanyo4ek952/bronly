"use client";

import { KeyboardEvent, useState } from "react";

import { cn } from "@/shared/lib/cn";

type AmenityItem = {
  label: string;
  popular?: boolean;
};

type AmenityCategory = {
  title: string;
  items: AmenityItem[];
};

type AmenityCategoryView = AmenityCategory & {
  selectedCount: number;
};

type RoomAmenitiesFieldProps = {
  name?: string;
  id?: string;
  label?: string;
  description?: string;
  initialAmenities?: string[];
};

const amenityCatalog: AmenityCategory[] = [
  {
    title: "Базовое",
    items: [
      { label: "Wi-Fi", popular: true },
      { label: "Кондиционер", popular: true },
      { label: "Отопление", popular: true },
      { label: "Телевизор", popular: true },
      { label: "Рабочее место", popular: true },
    ],
  },
  {
    title: "Кухня",
    items: [
      { label: "Кухня", popular: true },
      { label: "Плита", popular: true },
      { label: "Микроволновка", popular: true },
      { label: "Холодильник", popular: true },
      { label: "Чайник", popular: true },
      { label: "Посуда", popular: true },
    ],
  },
  {
    title: "Санузел и быт",
    items: [
      { label: "Стиральная машина", popular: true },
      { label: "Фен", popular: true },
      { label: "Утюг", popular: true },
      { label: "Гладильная доска" },
      { label: "Сушилка" },
    ],
  },
  {
    title: "Комфорт",
    items: [
      { label: "Балкон", popular: true },
      { label: "Вид из окна", popular: true },
      { label: "Шторы блэкаут" },
      { label: "Москитные сетки" },
    ],
  },
  {
    title: "На территории",
    items: [
      { label: "Парковка", popular: true },
      { label: "Бассейн" },
      { label: "Мангал / барбекю" },
      { label: "Терраса / веранда" },
      { label: "Лифт" },
    ],
  },
  {
    title: "Для семьи",
    items: [
      { label: "Детская кроватка" },
      { label: "Стульчик для кормления" },
    ],
  },
];

const catalogLabels = amenityCatalog.flatMap((category) => category.items.map((item) => item.label));
const popularLabels = new Set(
  amenityCatalog.flatMap((category) => category.items.filter((item) => item.popular).map((item) => item.label)),
);
const catalogLabelByKey = new Map(catalogLabels.map((label) => [normalizeAmenity(label), label]));

function normalizeAmenity(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function dedupeAmenities(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim().replace(/\s+/g, " ");

    if (!trimmed) {
      continue;
    }

    const key = normalizeAmenity(trimmed);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function splitInitialAmenities(initialAmenities: string[]) {
  const selected: string[] = [];
  const custom: string[] = [];

  for (const amenity of dedupeAmenities(initialAmenities)) {
    const catalogLabel = catalogLabelByKey.get(normalizeAmenity(amenity));

    if (catalogLabel) {
      selected.push(catalogLabel);
      continue;
    }

    custom.push(amenity);
  }

  return { selected, custom };
}

function buildInitialOpenCategories(selectedAmenities: string[], customAmenities: string[]) {
  const selectedKeys = new Set(selectedAmenities);
  const open = new Set<string>();

  amenityCatalog.forEach((category, index) => {
    if (index === 0 || category.items.some((item) => selectedKeys.has(item.label))) {
      open.add(category.title);
    }
  });

  if (customAmenities.length) {
    open.add("custom");
  }

  return open;
}

export function RoomAmenitiesField({
  name = "amenities",
  id = "room-amenities",
  label = "Удобства номера",
  description = "Отметьте то, что уже есть в номере. Остальное можно добавить своими словами.",
  initialAmenities = [],
}: RoomAmenitiesFieldProps) {
  const initialState = splitInitialAmenities(initialAmenities);
  const [selectedAmenities, setSelectedAmenities] = useState(initialState.selected);
  const [customAmenities, setCustomAmenities] = useState(initialState.custom);
  const [draftAmenity, setDraftAmenity] = useState("");
  const [openCategories, setOpenCategories] = useState(() =>
    buildInitialOpenCategories(initialState.selected, initialState.custom),
  );
  const [showAll, setShowAll] = useState(
    initialState.selected.some((amenity) => !popularLabels.has(amenity)) || initialState.custom.length > 0,
  );
  const selectedSet = new Set(selectedAmenities);
  const visibleCategories: AmenityCategoryView[] = amenityCatalog
    .map((category) => ({
      ...category,
      items: showAll ? category.items : category.items.filter((item) => item.popular),
      selectedCount: category.items.filter((item) => selectedSet.has(item.label)).length,
    }))
    .filter((category) => category.items.length > 0);
  const orderedSelectedAmenities = catalogLabels.filter((amenity) => selectedSet.has(amenity));
  const serializedAmenities = [...orderedSelectedAmenities, ...customAmenities].join("\n");
  const hasAdditionalAmenities = catalogLabels.some((amenity) => !popularLabels.has(amenity));

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((current) => {
      const next = new Set(current);

      if (next.has(amenity)) {
        next.delete(amenity);
      } else {
        next.add(amenity);
      }

      return catalogLabels.filter((item) => next.has(item));
    });
  }

  function toggleCategory(categoryTitle: string) {
    setOpenCategories((current) => {
      const next = new Set(current);

      if (next.has(categoryTitle)) {
        next.delete(categoryTitle);
      } else {
        next.add(categoryTitle);
      }

      return next;
    });
  }

  function addCustomAmenity() {
    const value = draftAmenity.trim().replace(/\s+/g, " ");

    if (!value) {
      return;
    }

    const catalogLabel = catalogLabelByKey.get(normalizeAmenity(value));

    if (catalogLabel) {
      setSelectedAmenities((current) => (current.includes(catalogLabel) ? current : [...current, catalogLabel]));
      setShowAll((current) => current || !popularLabels.has(catalogLabel));
      setDraftAmenity("");
      return;
    }

    setCustomAmenities((current) => dedupeAmenities([...current, value]));
    setOpenCategories((current) => {
      const next = new Set(current);
      next.add("custom");
      return next;
    });
    setDraftAmenity("");
  }

  function removeCustomAmenity(amenity: string) {
    const target = normalizeAmenity(amenity);
    setCustomAmenities((current) => current.filter((item) => normalizeAmenity(item) !== target));
  }

  function handleDraftAmenityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addCustomAmenity();
  }

  return (
    <div className="grid gap-[14px]">
      <div className="grid gap-1.5">
        <label className="text-[var(--label-size)] font-bold leading-[1.4] text-[var(--text-muted)]" htmlFor={`${id}-custom`}>
          {label}
        </label>
        <span className="text-xs leading-[1.45] text-[var(--text-muted)]">{description}</span>
      </div>

      <textarea hidden readOnly name={name} value={serializedAmenities} />

      <div className="grid gap-3 md:grid-cols-2 max-[640px]:grid-cols-1">
        {visibleCategories.map((category) => {
          const isOpen = openCategories.has(category.title);

          return (
            <section
              key={category.title}
              className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[rgb(248_250_252_/_0.9)] p-4 max-[640px]:p-[14px]"
              data-open={isOpen ? "true" : "false"}
            >
              <button
                type="button"
                className="flex min-h-8 w-full items-center justify-between gap-3 bg-transparent text-left text-[var(--color-text)]"
                aria-expanded={isOpen}
                onClick={() => toggleCategory(category.title)}
              >
                <span className="grid gap-1">
                  <strong className="text-[15px] leading-[1.3]">{category.title}</strong>
                  <small className="text-xs leading-[1.4] text-[var(--color-muted)] max-[640px]:hidden">
                    {category.selectedCount ? `Выбрано: ${category.selectedCount}` : `Пунктов: ${category.items.length}`}
                  </small>
                </span>
                <span
                  className={cn(
                    "text-[18px] leading-none text-[var(--color-muted)] transition-transform duration-[180ms] max-[640px]:inline-flex",
                    isOpen ? "rotate-0" : "-rotate-90",
                  )}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              <div className={cn("grid gap-3", !isOpen && "max-[640px]:hidden")}>
                <div className="grid gap-0 border-t border-[rgb(17_29_27_/_0.06)]" role="group" aria-label={category.title}>
                  {category.items.map((item, index) => {
                    const checked = selectedSet.has(item.label);

                    return (
                      <label
                        key={item.label}
                        className={cn(
                          "flex min-h-[52px] items-center gap-3 border-b border-[rgb(17_29_27_/_0.06)] bg-transparent px-0.5 py-3 text-sm leading-[1.4] transition-colors duration-[180ms] max-[640px]:min-h-[50px]",
                          index === category.items.length - 1 && "border-b-0",
                          checked && "text-[var(--color-primary-hover)]",
                        )}
                        data-checked={checked ? "true" : "false"}
                        data-last={index === category.items.length - 1 ? "true" : "false"}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAmenity(item.label)}
                          className="m-0 h-[18px] w-[18px] flex-none accent-[var(--color-primary)]"
                        />
                        <span className={cn("text-sm text-[var(--color-text)]", checked && "text-inherit")}>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {hasAdditionalAmenities ? (
        <button
          type="button"
          className="justify-self-start text-sm font-bold text-[var(--color-primary)] max-[640px]:w-full max-[640px]:rounded-[var(--radius-md)] max-[640px]:border max-[640px]:border-[var(--color-border)] max-[640px]:bg-[var(--color-bg)] max-[640px]:px-[14px] max-[640px]:py-3"
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? "Скрыть дополнительные удобства" : "Показать еще удобства"}
        </button>
      ) : null}

      <section
        className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[rgb(248_250_252_/_0.9)] p-4 max-[640px]:p-[14px]"
        data-open={openCategories.has("custom") ? "true" : "false"}
      >
        <button
          type="button"
          className="flex min-h-8 w-full items-center justify-between gap-3 bg-transparent text-left text-[var(--color-text)]"
          aria-expanded={openCategories.has("custom")}
          onClick={() => toggleCategory("custom")}
        >
          <span className="grid gap-1">
            <strong className="text-[15px] leading-[1.3]">Свои удобства</strong>
            <small className="text-xs leading-[1.4] text-[var(--color-muted)] max-[640px]:hidden">
              {customAmenities.length ? `Добавлено: ${customAmenities.length}` : "То, чего нет в списке"}
            </small>
          </span>
          <span
            className={cn(
              "text-[18px] leading-none text-[var(--color-muted)] transition-transform duration-[180ms] max-[640px]:inline-flex",
              openCategories.has("custom") ? "rotate-0" : "-rotate-90",
            )}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        <div className={cn("grid gap-3", !openCategories.has("custom") && "max-[640px]:hidden")}>
          <div className="grid gap-1.5">
            <strong className="text-[15px] leading-[1.3]">Свои удобства</strong>
            <span className="text-[13px] leading-[1.5] text-[var(--color-muted)]">Добавьте то, чего нет в списке выше.</span>
          </div>

          {customAmenities.length ? (
            <div className="flex flex-wrap gap-2">
              {customAmenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex min-h-[34px] items-center gap-2 rounded-full border border-[rgb(var(--color-primary-rgb)_/_0.16)] bg-[var(--color-primary-pale)] px-[10px] py-1.5 text-[13px] text-[var(--color-text)]"
                >
                  <span>{amenity}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomAmenity(amenity)}
                    aria-label={`Удалить: ${amenity}`}
                    className="grid h-[18px] w-[18px] place-items-center rounded-full bg-transparent text-base leading-none text-[var(--color-muted)]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5 max-[640px]:grid-cols-1">
            <input
              id={`${id}-custom`}
              type="text"
              className="min-h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] leading-[1.45] text-[var(--text)] transition-[border-color,box-shadow] duration-[180ms] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[rgb(var(--color-primary-rgb)_/_0.44)] focus:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]"
              value={draftAmenity}
              onChange={(event) => setDraftAmenity(event.target.value)}
              onKeyDown={handleDraftAmenityKeyDown}
              placeholder="Например: кофемашина"
            />
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 text-[13px] font-bold leading-none text-[var(--text)] transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms] hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)]"
              onClick={addCustomAmenity}
            >
              Добавить
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
