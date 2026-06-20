"use client";

type SearchAndFilterBarProps = {
  query: string;
  sort: "newest" | "alphabetical";
  onQueryChange: (value: string) => void;
  onSortChange: (value: "newest" | "alphabetical") => void;
};

export function SearchAndFilterBar({ query, sort, onQueryChange, onSortChange }: SearchAndFilterBarProps) {
  return (
    <div className="br-search-filter-bar br-card">
      <label className="br-search-filter-bar__search">
        <span className="br-label">Поиск по объектам</span>
        <input
          className="br-field"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Название, город или адрес"
        />
      </label>
      <label className="br-search-filter-bar__sort">
        <span className="br-label">Сортировка</span>
        <select
          className="br-field"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as "newest" | "alphabetical")}
        >
          <option value="newest">Сначала новые</option>
          <option value="alphabetical">По названию</option>
        </select>
      </label>
    </div>
  );
}
