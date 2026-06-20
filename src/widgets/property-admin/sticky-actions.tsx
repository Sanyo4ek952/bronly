import type { ReactNode } from "react";

type StickyActionsProps = {
  children: ReactNode;
  desktopInline?: boolean;
};

export function StickyActions({ children, desktopInline = false }: StickyActionsProps) {
  return (
    <div className={`br-sticky-actions${desktopInline ? " br-sticky-actions--desktop-inline" : ""}`}>
      {children}
    </div>
  );
}
