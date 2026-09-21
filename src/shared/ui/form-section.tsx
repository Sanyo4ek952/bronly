import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import { FormSectionAccordionClient } from "@/shared/ui/form-section-accordion-client";

type FormSectionVariant = "card" | "accordion" | "plain" | "bare";

type FormSectionProps = {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  variant?: FormSectionVariant;
  defaultOpen?: boolean;
};

export function FormSection({
  id,
  title,
  description,
  children,
  className,
  bodyClassName,
  variant = "card",
  defaultOpen = true,
}: FormSectionProps) {
  const plainSectionClass = cn(
    "grid gap-[14px] rounded-[20px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(248_250_252_/_0.92))] p-[18px] scroll-mt-24",
    "max-[640px]:rounded-[18px] max-[640px]:p-[14px]",
  );
  const cardSectionClass = cn(
    "grid gap-4 rounded-[22px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-[18px] scroll-mt-24",
    "max-[720px]:rounded-[20px] max-[720px]:p-4",
  );

  if (variant === "plain" || variant === "bare") {
    return (
      <section id={id} className={cn(variant === "bare" ? "grid gap-4 scroll-mt-24" : plainSectionClass, className)}>
        <div className="grid gap-1">
          <h3 className="text-base font-semibold leading-[1.25] text-[var(--color-text)]">{title}</h3>
          {description ? <p className="text-[13px] leading-[1.5] text-[var(--color-muted)]">{description}</p> : null}
        </div>
        <div className={cn("grid gap-1.5", bodyClassName)}>{children}</div>
      </section>
    );
  }

  if (variant === "accordion") {
    return (
      <FormSectionAccordionClient
        id={id}
        title={title}
        description={description}
        className={className}
        bodyClassName={bodyClassName}
        defaultOpen={defaultOpen}
      >
        {children}
      </FormSectionAccordionClient>
    );
  }

  return (
    <section id={id} className={cn(cardSectionClass, className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">{title}</h3>
          {description ? <p className="mt-1 text-[14px] leading-[1.5] text-[var(--color-muted)]">{description}</p> : null}
        </div>
      </div>
      <div className={cn("grid gap-4", bodyClassName)}>{children}</div>
    </section>
  );
}
