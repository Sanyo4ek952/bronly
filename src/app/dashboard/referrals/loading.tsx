function ShimmerBlock({ className }: { className: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-[var(--surface-subtle)] after:absolute after:inset-0 after:animate-[propertyInventoryShimmer_1.4s_linear_infinite] after:bg-[linear-gradient(90deg,transparent,rgb(255_255_255_/_0.72),transparent)] after:content-[''] ${className}`}
    />
  );
}

export default function ReferralsLoading() {
  return (
    <section className="grid gap-6 max-[640px]:gap-5" aria-label="Загрузка персональных приглашений" aria-busy="true">
      <div className="grid max-w-[760px] gap-3">
        <ShimmerBlock className="h-3 w-48 rounded-full" />
        <ShimmerBlock className="h-11 w-[430px] max-w-full rounded-xl" />
        <ShimmerBlock className="h-4 w-[620px] max-w-full rounded-full" />
      </div>
      <ShimmerBlock className="h-[46px] w-[300px] max-w-full rounded-[var(--radius-lg)]" />
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
        <div className="grid min-h-[310px] lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid content-start gap-5 p-[26px] max-[640px]:p-4">
            <ShimmerBlock className="h-[38px] w-56 max-w-full rounded-xl" />
            <ShimmerBlock className="h-8 w-64 max-w-full rounded-lg" />
            <ShimmerBlock className="h-20 w-full rounded-[var(--radius-lg)]" />
          </div>
          <ShimmerBlock className="min-h-[280px] border-l border-[var(--border)] max-[1023px]:border-l-0 max-[1023px]:border-t" />
        </div>
        <ShimmerBlock className="h-[150px] border-t border-[var(--border)]" />
      </div>
    </section>
  );
}
