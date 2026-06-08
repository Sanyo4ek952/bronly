"use client";

import { KeyboardEvent, useState } from "react";

type AmenityItem = {
  label: string;
  popular?: boolean;
};

type AmenityCategory = {
  title: string;
  items: AmenityItem[];
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
  const [showAll, setShowAll] = useState(
    initialState.selected.some((amenity) => !popularLabels.has(amenity)) || initialState.custom.length > 0,
  );
  const selectedSet = new Set(selectedAmenities);
  const visibleCategories = amenityCatalog
    .map((category) => ({
      ...category,
      items: showAll ? category.items : category.items.filter((item) => item.popular),
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

      return catalogLabels.filter((label) => next.has(label));
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
    <div className="br-form-field br-room-amenities-field">
      <div className="br-room-amenities-field__intro">
        <label className="br-label" htmlFor={`${id}-custom`}>
          {label}
        </label>
        <span className="br-form-help">{description}</span>
      </div>

      <textarea hidden readOnly name={name} value={serializedAmenities} />

      <div className="br-room-amenities-grid">
        {visibleCategories.map((category) => (
          <section key={category.title} className="br-room-amenities-card">
            <h3>{category.title}</h3>
            <div className="br-room-amenities-options">
              {category.items.map((item) => (
                <label key={item.label} className="br-room-amenities-option">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(item.label)}
                    onChange={() => toggleAmenity(item.label)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      {hasAdditionalAmenities ? (
        <button type="button" className="br-link-button" onClick={() => setShowAll((current) => !current)}>
          {showAll ? "Скрыть дополнительные удобства" : "Показать еще удобства"}
        </button>
      ) : null}

      <section className="br-room-amenities-custom">
        <div className="br-room-amenities-custom__header">
          <strong>Свои удобства</strong>
          <span>Добавьте то, чего нет в списке выше.</span>
        </div>

        {customAmenities.length ? (
          <div className="br-room-amenities-custom__list">
            {customAmenities.map((amenity) => (
              <span key={amenity} className="br-room-amenities-custom__chip">
                <span>{amenity}</span>
                <button type="button" onClick={() => removeCustomAmenity(amenity)} aria-label={`Удалить: ${amenity}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="br-room-amenities-custom__composer">
          <input
            id={`${id}-custom`}
            type="text"
            className="br-field"
            value={draftAmenity}
            onChange={(event) => setDraftAmenity(event.target.value)}
            onKeyDown={handleDraftAmenityKeyDown}
            placeholder="Например: кофемашина"
          />
          <button type="button" className="br-button br-button--secondary" onClick={addCustomAmenity}>
            Добавить
          </button>
        </div>
      </section>
    </div>
  );
}
