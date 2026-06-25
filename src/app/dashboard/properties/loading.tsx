function ShimmerBlock({ className }: { className: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-[linear-gradient(180deg,rgb(255_255_255_/_0.9),rgb(247_250_250_/_0.85))] after:absolute after:inset-0 after:bg-[linear-gradient(90deg,transparent,rgb(255_255_255_/_0.74),transparent)] after:content-[''] after:animate-[propertyInventoryShimmer_1.4s_linear_infinite] ${className}`}
    />
  );
}

export default function PropertiesLoading() {
  return (
    <section className="grid gap-4 max-[520px]:gap-3" aria-label="Загрузка объектов">
      <ShimmerBlock className="min-h-40 rounded-[28px] border border-[rgb(var(--color-primary-rgb)_/_0.10)]" />

      <div className="grid grid-cols-5 gap-3 max-[960px]:grid-cols-2 max-[720px]:grid-cols-2 max-[520px]:gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <ShimmerBlock
            key={index}
            className="min-h-24 rounded-[22px] border border-[var(--border)] max-[720px]:min-h-[74px] max-[520px]:min-h-[88px]"
          />
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-4 max-[1180px]:grid-cols-1">
        <div className="grid gap-4 max-[520px]:gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ShimmerBlock key={index} className="min-h-[280px] rounded-[26px] border border-[rgb(16_24_40_/_0.08)]" />
          ))}
        </div>

        <aside className="grid gap-4 max-[1180px]:grid-cols-3 max-[960px]:grid-cols-2 max-[720px]:hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <ShimmerBlock key={index} className="min-h-[180px] rounded-3xl border border-[rgb(var(--color-primary-rgb)_/_0.10)]" />
          ))}
        </aside>
      </div>
    </section>
  );
}
