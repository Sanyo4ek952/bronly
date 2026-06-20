"use client";

import type { OwnerInventoryListItem } from "@/entities/property";
import { useMemo, useState } from "react";

import { ObjectCard } from "./object-card";
import { SearchAndFilterBar } from "./search-and-filter-bar";

type PropertyInventoryBrowserProps = {
  properties: OwnerInventoryListItem[];
  standaloneRooms: OwnerInventoryListItem[];
};

function matchesQuery(item: OwnerInventoryListItem, query: string) {
  const haystack = [item.title, item.city, item.address].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function sortItems(items: OwnerInventoryListItem[], sort: "newest" | "alphabetical") {
  return [...items].sort((left, right) => {
    if (sort === "alphabetical") {
      return left.title.localeCompare(right.title, "ru");
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function PropertyInventoryBrowser({ properties, standaloneRooms }: PropertyInventoryBrowserProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "alphabetical">("newest");
  const filteredProperties = useMemo(
    () => sortItems(properties.filter((item) => matchesQuery(item, query)), sort),
    [properties, query, sort],
  );
  const filteredStandaloneRooms = useMemo(
    () => sortItems(standaloneRooms.filter((item) => matchesQuery(item, query)), sort),
    [standaloneRooms, query, sort],
  );

  return (
    <div className="br-owner-stack">
      <SearchAndFilterBar query={query} sort={sort} onQueryChange={setQuery} onSortChange={setSort} />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h3>Объекты</h3>
            <p>Карточки ведут к номерам, календарю занятости и настройкам публикации.</p>
          </div>
        </div>

        {filteredProperties.length ? (
          <div className="br-property-admin-grid">
            {filteredProperties.map((item) =>
              item.kind === "standalone_room" ? null : <ObjectCard key={item.id} item={item} />,
            )}
          </div>
        ) : (
          <p className="br-owner-muted">По этому запросу объекты не найдены.</p>
        )}
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h3>Отдельные номера</h3>
            <p>Самостоятельные номера без объекта открываются на отдельной странице с календарём и настройками.</p>
          </div>
        </div>

        {filteredStandaloneRooms.length ? (
          <div className="br-property-admin-grid">
            {filteredStandaloneRooms.map((item) =>
              item.kind === "standalone_room" ? <ObjectCard key={item.id} item={item} /> : null,
            )}
          </div>
        ) : (
          <p className="br-owner-muted">По этому запросу отдельные номера не найдены.</p>
        )}
      </section>
    </div>
  );
}
