import type { ReactNode } from "react";

type DangerZoneProps = {
  title: string;
  description: string;
  children: ReactNode;
  compact?: boolean;
};

export function DangerZone({ title, description, children, compact = false }: DangerZoneProps) {
  return (
    <section className={`br-danger-zone br-card${compact ? " br-danger-zone--compact" : ""}`}>
      <div className="br-danger-zone__copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="br-danger-zone__body">{children}</div>
    </section>
  );
}
