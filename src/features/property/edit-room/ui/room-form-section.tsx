import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type RoomFormSectionProps = {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
};

export function RoomFormSection({ title, description, className, children }: RoomFormSectionProps) {
  return (
    <section className={cn("br-room-form__section", className)}>
      <div className="br-room-form__section-header">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="br-room-form__section-body">{children}</div>
    </section>
  );
}
