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
  const sectionClass = cn(
    "grid gap-4 rounded-[22px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-[18px] scroll-mt-24",
    "max-[720px]:rounded-[20px] max-[720px]:p-4",
    className,
  );

  return (
    <section id={id} className={sectionClass} data-open={open}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 bg-transparent text-left text-inherit"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">{title}</h3>
            {description ? <p className="mt-1 text-[14px] leading-[1.5] text-[var(--color-muted)]">{description}</p> : null}
          </div>
        </div>
        <ChevronDown
          className={cn("mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-muted)] transition-transform duration-[180ms]", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open ? <div className={cn("grid gap-4", bodyClassName)}>{children}</div> : null}
    </section>
  );
}
