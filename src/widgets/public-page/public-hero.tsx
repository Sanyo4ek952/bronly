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
    <section className={cn("br-public-hero br-card br-card--raised br-card--padding-none", className)}>
      <div className="br-public-hero__media">
        {imageUrl ? (
          <Image src={imageUrl} alt={imageAlt} width={1600} height={1000} unoptimized className="br-public-hero__image" />
        ) : null}
      </div>
      <div className="br-public-hero__body">
        <div className="br-public-hero__copy">
          {eyebrow ? <span className="br-public-hero__eyebrow">{eyebrow}</span> : null}
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
          {summary ? <div className="br-public-hero__summary">{summary}</div> : null}
          {notice ? <div className="br-public-hero__notice">{notice}</div> : null}
        </div>
        {actions ? <div className="br-public-hero__actions">{actions}</div> : null}
      </div>
    </section>
  );
}
