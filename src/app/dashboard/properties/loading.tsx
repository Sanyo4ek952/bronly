export default function PropertiesLoading() {
  return (
    <section className="br-property-hub br-property-hub--loading" aria-label="Загрузка объектов">
      <div className="br-property-hub-header br-card br-property-hub-skeleton br-property-hub-skeleton--header" />

      <div className="br-property-hub-stats">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="br-property-hub-stat-card br-card br-property-hub-skeleton br-property-hub-skeleton--stat" />
        ))}
      </div>

      <div className="br-property-hub-layout">
        <div className="br-property-hub-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="br-property-hub-card br-card br-property-hub-skeleton br-property-hub-skeleton--card" />
          ))}
        </div>

        <aside className="br-property-hub-aside">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="br-property-hub-side-card br-card br-property-hub-skeleton br-property-hub-skeleton--side" />
          ))}
        </aside>
      </div>
    </section>
  );
}
