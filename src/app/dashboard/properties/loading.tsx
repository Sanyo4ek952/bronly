function ShimmerBlock({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden bg-[var(--surface-subtle)] after:absolute after:inset-0 after:animate-[propertyInventoryShimmer_1.4s_linear_infinite] after:bg-[linear-gradient(90deg,transparent,rgb(255_255_255_/_0.72),transparent)] after:content-[''] ${className}`} />
  );
}

export default function PropertiesLoading() {
  return (
    <section className="grid gap-6 max-[720px]:gap-5" aria-label="Загрузка объектов и номеров" aria-busy="true">
      <div className="flex items-end justify-between gap-6 max-[720px]:grid">
        <div className="grid gap-3"><ShimmerBlock className="h-3 w-36 rounded-full" /><ShimmerBlock className="h-11 w-72 max-w-full rounded-xl" /><ShimmerBlock className="h-4 w-[420px] max-w-full rounded-full" /></div>
        <div className="flex gap-2.5 max-[720px]:grid max-[720px]:grid-cols-2 max-[420px]:grid-cols-1"><ShimmerBlock className="h-[46px] w-40 rounded-[14px] max-[720px]:w-full" /><ShimmerBlock className="h-[46px] w-40 rounded-[14px] max-[720px]:w-full" /></div>
      </div>
      <ShimmerBlock className="h-[96px] rounded-[24px] max-[720px]:h-[190px]" />
      <ShimmerBlock className="h-[70px] rounded-[18px] border border-[var(--border)]" />
      <div className="grid grid-cols-[minmax(0,1fr)_272px] gap-[30px] max-[1180px]:grid-cols-1">
        <div className="grid gap-[14px]"><ShimmerBlock className="h-8 w-48 rounded-lg" /><ShimmerBlock className="min-h-[238px] rounded-[22px] border border-[var(--border)]" /><ShimmerBlock className="min-h-[238px] rounded-[22px] border border-[var(--border)]" /></div>
        <ShimmerBlock className="min-h-[260px] rounded-[22px] max-[1180px]:hidden" />
      </div>
    </section>
  );
}
