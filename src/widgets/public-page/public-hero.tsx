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
}: PublicHeroProps) {
  return (
    <section className={cn("grid overflow-hidden rounded-[var(--radius-lg)] border border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[var(--surface)] shadow-[var(--shadow-md)]", className)}>
      <div className="relative min-h-[340px] overflow-hidden bg-[linear-gradient(135deg,#d4e8e4_0%,#b8d6d4_34%,#f2e2cf_72%,#efe7da_100%)] max-[640px]:min-h-60">
        {imageUrl ? (
          <Image src={imageUrl} alt={imageAlt} width={1600} height={1000} unoptimized className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="grid items-end gap-6 p-7 max-[640px]:p-[18px] lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <div className="grid gap-[14px]">
          {eyebrow ? <span className="inline-flex min-h-8 w-fit items-center rounded-full bg-[rgb(var(--color-primary-rgb)_/_0.10)] px-3 text-xs font-bold text-[var(--color-primary-hover)]">{eyebrow}</span> : null}
          <h1 className="text-[clamp(2rem,4vw,2.625rem)] font-extrabold leading-[1.06]">{title}</h1>
          {description ? <p className="text-sm leading-relaxed text-[var(--color-muted)]">{description}</p> : null}
          {summary ? <div className="grid gap-3">{summary}</div> : null}
          {notice ? <div className="grid gap-3">{notice}</div> : null}
        </div>
        {actions ? <div className="grid min-w-0 content-end gap-[14px]">{actions}</div> : null}
      </div>
    </section>
  );
}
