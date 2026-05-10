type StatItem = {
  label: string;
  value: string;
};

type StatGridProps = Readonly<{
  items: StatItem[];
}>;

export function StatGrid({ items }: StatGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-card p-5">
          <div className="text-sm text-muted-foreground">{item.label}</div>
          <div className="mt-2 text-3xl font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
