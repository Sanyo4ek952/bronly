"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";

type FormSectionAccordionClientProps = {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  defaultOpen?: boolean;
};

export function FormSectionAccordionClient({
  id,
  title,
  description,
  children,
  className,
  bodyClassName,
  defaultOpen = true,
}: FormSectionAccordionClientProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={id}
      className={cn("br-form-section-card br-form-section-card--accordion br-card br-anchor-target", className)}
      data-open={open}
    >
      <button
        type="button"
        className="br-form-section-card__trigger"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <div className="br-form-section-card__header">
          <div>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        <ChevronDown className="br-form-section-card__chevron" aria-hidden="true" />
      </button>
      {open ? <div className={cn("br-form-section-card__body", bodyClassName)}>{children}</div> : null}
    </section>
  );
}
