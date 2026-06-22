import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type InlineNoticeProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  tone?: "default" | "soft" | "warning";
  children: ReactNode;
};

export function InlineNotice({
  title,
  tone = "default",
  children,
  className,
  ...props
}: InlineNoticeProps) {
  return (
    <section
      className={cn(
        "br-inline-notice",
        tone === "soft" && "br-inline-notice--soft",
        tone === "warning" && "br-inline-notice--warning",
        className,
      )}
      {...props}
    >
      {title ? <strong className="br-inline-notice__title">{title}</strong> : null}
      <div>{children}</div>
    </section>
  );
}
