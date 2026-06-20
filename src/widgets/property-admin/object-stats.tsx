type ObjectStatItem = {
  label: string;
  value: string;
  tone?: "default" | "accent";
};

type ObjectStatsProps = {
  items: ObjectStatItem[];
  compact?: boolean;
};

export function ObjectStats({ items, compact = false }: ObjectStatsProps) {
  return (
    <div className={`br-object-stats${compact ? " br-object-stats--compact" : ""}`}>
      {items.map((item) => (
        <div key={item.label} className="br-object-stats__item">
          <span>{item.label}</span>
          <strong className={item.tone === "accent" ? "br-object-stats__value--accent" : undefined}>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
