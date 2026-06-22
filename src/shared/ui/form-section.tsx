import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import { FormSectionAccordionClient } from "@/shared/ui/form-section-accordion-client";

type FormSectionVariant = "card" | "accordion" | "plain";

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
  if (variant === "plain") {
    return (
      <section id={id} className={cn("br-room-form__section", className)}>
        <div className="br-room-form__section-header">
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        <div className={cn("br-room-form__section-body", bodyClassName)}>{children}</div>
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
    <section id={id} className={cn("br-form-section-card br-card br-anchor-target", className)}>
      <div className="br-form-section-card__header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      <div className={cn("br-form-section-card__body", bodyClassName)}>{children}</div>
    </section>
  );
}
