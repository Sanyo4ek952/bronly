import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type DangerZoneProps = {
  title: string;
  description: string;
  children: ReactNode;
  compact?: boolean;
};

export function DangerZone({ title, description, children, compact = false }: DangerZoneProps) {
  return (
    <section
      className={cn(
        "grid gap-4 rounded-[22px] border border-[rgb(216_93_74_/_0.18)] bg-[linear-gradient(180deg,#fff9f8_0%,#fff2ef_100%)] p-[18px]",
        "max-[720px]:rounded-[20px] max-[720px]:p-4",
        compact && "gap-3",
      )}
    >
      <div className="grid gap-1.5">
        <h3 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">{title}</h3>
        <p className="text-sm leading-[1.55] text-[var(--color-muted)]">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}
