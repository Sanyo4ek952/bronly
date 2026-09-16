function ShimmerBlock({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden bg-[var(--surface-subtle)] after:absolute after:inset-0 after:animate-[propertyInventoryShimmer_1.4s_linear_infinite] after:bg-[linear-gradient(90deg,transparent,rgb(255_255_255_/_0.72),transparent)] after:content-[''] ${className}`} />
  );
}
export default function RequestsLoading() {
  return (
    <section className="grid gap-6 max-[720px]:gap-5" aria-label="Загрузка заявок" aria-busy="true">
      <div className="flex items-end justify-between gap-6 max-[390px]:grid">
        <div className="grid gap-3">
          <ShimmerBlock className="h-3 w-44 rounded-full" />
          <ShimmerBlock className="h-11 w-52 max-w-full rounded-xl" />
          <ShimmerBlock className="h-4 w-[510px] max-w-full rounded-full" />
        </div>
        <ShimmerBlock className="h-14 w-[118px] rounded-xl max-[390px]:h-8 max-[390px]:w-32" />
      </div>
      <ShimmerBlock className="h-[66px] rounded-[18px] border border-[var(--border)] max-[720px]:h-[112px] max-[390px]:h-[120px]" />
      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-6 max-[1180px]:grid-cols-[minmax(0,1fr)_330px] max-[820px]:block">
        <div className="overflow-hidden rounded-[22px] border border-[var(--border)]">
          <ShimmerBlock className="h-10 w-full rounded-none" />
          <div className="grid gap-px bg-[var(--border)]">
            <ShimmerBlock className="h-[116px] w-full rounded-none" />
            <ShimmerBlock className="h-[116px] w-full rounded-none" />
            <ShimmerBlock className="h-[116px] w-full rounded-none" />
          </div>
        </div>
        <ShimmerBlock className="min-h-[620px] rounded-[22px] border border-[var(--border)] max-[820px]:hidden" />
      </div>
    </section>
  );
}
