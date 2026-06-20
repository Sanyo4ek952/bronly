import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

type AdminPageLayoutProps = {
  main: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export function AdminPageLayout({ main, aside, className }: AdminPageLayoutProps) {
  return (
    <div className={cn("br-property-admin-layout", Boolean(aside) && "br-property-admin-layout--split", className)}>
      <div className="br-property-admin-layout__main">{main}</div>
      {aside ? <aside className="br-property-admin-layout__aside">{aside}</aside> : null}
    </div>
  );
}
