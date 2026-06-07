import { Panel } from "@/shared/ui/panel";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <Panel as="article" className="br-stat-card" surface="subtle" padding="md">
      <span>{title}</span>
      <strong>{value}</strong>
      {subtitle ? <small>{subtitle}</small> : null}
    </Panel>
  );
}
