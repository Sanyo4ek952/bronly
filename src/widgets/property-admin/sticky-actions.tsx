import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type StickyActionsProps = {
  children: ReactNode;
  desktopInline?: boolean;
};

export function StickyActions({ children, desktopInline = false }: StickyActionsProps) {
  return (
    <div
      className={cn(
        "sticky bottom-[calc(84px+var(--safe-area-bottom))] z-20 grid gap-2.5 rounded-[20px] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.96)] p-2.5 shadow-[var(--shadow-md)]",
        desktopInline ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2",
        "max-[720px]:bottom-3 max-[720px]:grid-cols-1",
      )}
    >
      {children}
    </div>
  );
}
