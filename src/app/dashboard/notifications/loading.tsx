function ShimmerBlock({ className }: { className: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-[var(--surface-subtle)] after:absolute after:inset-0 after:animate-[propertyInventoryShimmer_1.4s_linear_infinite] after:bg-[linear-gradient(90deg,transparent,rgb(255_255_255_/_0.72),transparent)] after:content-[''] ${className}`}
    />
  );
}

export default function NotificationsLoading() {
  return (
    <section className="grid gap-6 max-[640px]:gap-5" aria-label="Загрузка уведомлений" aria-busy="true">
      <div className="grid max-w-[760px] gap-3">
        <ShimmerBlock className="h-3 w-40 rounded-full" />
        <ShimmerBlock className="h-11 w-64 max-w-full rounded-xl" />
        <ShimmerBlock className="h-4 w-[560px] max-w-full rounded-full" />
      </div>

      <div className="grid min-w-0 items-start gap-[22px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
          <div className="grid gap-3 border-b border-[var(--border)] p-6 max-[640px]:p-4">
            <ShimmerBlock className="h-6 w-52 max-w-full rounded-lg" />
            <ShimmerBlock className="h-4 w-64 max-w-full rounded-full" />
          </div>
          <div className="grid gap-px bg-[var(--border)]">
            <ShimmerBlock className="h-[150px] w-full rounded-none" />
            <ShimmerBlock className="h-[150px] w-full rounded-none" />
            <ShimmerBlock className="h-[150px] w-full rounded-none" />
          </div>
        </div>
        <ShimmerBlock className="h-[360px] rounded-[var(--radius-lg)] border border-[var(--border)] xl:sticky xl:top-6" />
      </div>
    </section>
  );
}
