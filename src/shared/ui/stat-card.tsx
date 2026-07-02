import { Panel } from "@/shared/ui/panel";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <Panel
      as="article"
      className="grid gap-1.5 rounded-[20px] border-[rgb(16_24_40_/_0.08)] bg-[rgb(255_255_255_/_0.92)] max-[640px]:rounded-[18px]"
      surface="subtle"
      padding="md"
    >
      <span className="text-xs leading-[1.4] text-[var(--text-muted)]">{title}</span>
      <strong className="text-[22px] font-extrabold leading-none text-[var(--text)]">{value}</strong>
      {subtitle ? <small className="text-xs leading-[1.45] text-[var(--text-muted)]">{subtitle}</small> : null}
    </Panel>
  );
}
