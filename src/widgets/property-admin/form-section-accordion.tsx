"use client";

import type { ReactNode } from "react";

import { FormSection } from "@/shared/ui";

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
  return (
    <FormSection id={id} title={title} description={description} variant="accordion" defaultOpen={defaultOpen}>
      {children}
    </FormSection>
  );
}
