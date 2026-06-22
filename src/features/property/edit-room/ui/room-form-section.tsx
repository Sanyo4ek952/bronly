import type { ReactNode } from "react";

import { FormSection } from "@/shared/ui";

type RoomFormSectionProps = {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
};

export function RoomFormSection({ title, description, className, children }: RoomFormSectionProps) {
  return (
    <FormSection variant="plain" title={title} description={description} className={className}>
      {children}
    </FormSection>
  );
}
