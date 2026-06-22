import type { ReactNode } from "react";

import { FormSection } from "@/shared/ui";

type FormSectionCardProps = {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSectionCard({ id, title, description, children }: FormSectionCardProps) {
  return (
    <FormSection id={id} title={title} description={description} variant="card">
      {children}
    </FormSection>
  );
}
