import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/shared/lib";

type PublicHeroProps = {
  imageUrl?: string | null;
  imageAlt: string;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  summary?: ReactNode;
  notice?: ReactNode;
  actions?: ReactNode;
  className?: string;
  variant?: "default" | "compact";
};

export function PublicHero({
  imageUrl,
  imageAlt,
  eyebrow,
  title,
  description,
  summary,
  notice,
  actions,
  className,
  variant = "default",
}: PublicHeroProps) {
  const compact = variant === "compact";

  return (
    <section
      className={cn(
        compact
          ? "grid items-center gap-5 py-7 sm:py-8 md:grid-cols-[minmax(0,1fr)_240px] md:gap-10"
          : "grid overflow-hidden rounded-[calc(var(--radius-lg)+8px)] border border-[rgb(var(--color-primary-rgb)_/_0.12)] bg-[var(--surface)] shadow-[var(--shadow-md)] lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]",
        className,
      )}
    >
      <div className={compact
        ? cn("order-2 hidden aspect-[3/2] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-subtle)]", imageUrl && "md:block")
        : "relative min-h-[340px] overflow-hidden bg-[linear-gradient(135deg,#d4e8e4_0%,#b8d6d4_34%,#f2e2cf_72%,#efe7da_100%)] max-[640px]:min-h-60 lg:min-h-[440px]"}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={1600}
            height={1000}
            priority
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className={compact ? "grid min-w-0 gap-4" : "grid min-w-0 content-center gap-6 p-7 max-[640px]:p-[18px] lg:p-9"}>
        <div className="grid min-w-0 gap-[14px]">
          {eyebrow ? <span className={compact ? "text-sm text-[var(--text-muted)]" : "inline-flex min-h-8 w-fit items-center rounded-full bg-[rgb(var(--color-primary-rgb)_/_0.10)] px-3 text-xs font-bold text-[var(--color-primary-hover)]"}>{eyebrow}</span> : null}
          <h1 className={compact ? "text-[clamp(1.75rem,3.2vw,2.75rem)] font-extrabold leading-[1.12] tracking-[-0.035em] [overflow-wrap:anywhere]" : "text-[clamp(2.25rem,4.8vw,3.75rem)] font-extrabold leading-[0.98] tracking-[-0.035em]"}>{title}</h1>
          {description ? <p className="text-sm leading-relaxed text-[var(--color-muted)]">{description}</p> : null}
          {summary ? <div className="grid gap-3">{summary}</div> : null}
          {notice ? <div className="grid gap-3">{notice}</div> : null}
        </div>
        {actions ? <div className="grid min-w-0 gap-[14px]">{actions}</div> : null}
      </div>
    </section>
  );
}
