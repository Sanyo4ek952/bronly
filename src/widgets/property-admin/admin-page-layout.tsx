import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

type AdminPageLayoutProps = {
  main: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export function AdminPageLayout({ main, aside, className }: AdminPageLayoutProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        Boolean(aside) && "xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-start",
        className,
      )}
    >
      <div className="grid gap-3">{main}</div>
      {aside ? <aside className="grid gap-3">{aside}</aside> : null}
    </div>
  );
}
