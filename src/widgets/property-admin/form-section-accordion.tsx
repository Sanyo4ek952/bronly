"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type FormSectionAccordionProps = {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function FormSectionAccordion({
  id,
  title,
  description,
  children,
  defaultOpen = true,
}: FormSectionAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="br-form-section-card br-form-section-card--accordion br-card br-anchor-target" data-open={open}>
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
      {open ? <div className="br-form-section-card__body">{children}</div> : null}
    </section>
  );
}
