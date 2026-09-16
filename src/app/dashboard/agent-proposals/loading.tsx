function ShimmerBlock({ className }: { className: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-[var(--surface-subtle)] after:absolute after:inset-0 after:animate-[propertyInventoryShimmer_1.4s_linear_infinite] after:bg-[linear-gradient(90deg,transparent,rgb(255_255_255_/_0.72),transparent)] after:content-[''] ${className}`}
    />
  );
}

export default function AgentProposalsLoading() {
  return (
    <section className="grid gap-6 max-[640px]:gap-5" aria-label="Загрузка предложений агентов" aria-busy="true">
      <div className="grid max-w-[760px] gap-3">
        <ShimmerBlock className="h-3 w-36 rounded-full" />
        <ShimmerBlock className="h-11 w-44 max-w-full rounded-xl" />
        <ShimmerBlock className="h-4 w-[620px] max-w-full rounded-full" />
      </div>
      <ShimmerBlock className="h-[54px] w-full rounded-[var(--radius-lg)] border border-[var(--border)]" />
      {[0, 1].map((section) => (
        <div key={section} className="grid gap-[14px]">
          <div className="flex items-end justify-between gap-4">
            <div className="grid gap-2">
              <ShimmerBlock className="h-7 w-64 max-w-full rounded-lg" />
              <ShimmerBlock className="h-3.5 w-80 max-w-full rounded-full" />
            </div>
            <ShimmerBlock className="h-7 w-28 rounded-full" />
          </div>
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
            <ShimmerBlock className="h-[190px] w-full rounded-none" />
            <ShimmerBlock className="h-[190px] w-full rounded-none border-t border-[var(--border)]" />
          </div>
        </div>
      ))}
    </section>
  );
}
