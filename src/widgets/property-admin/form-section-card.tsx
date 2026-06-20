import type { ReactNode } from "react";

type FormSectionCardProps = {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSectionCard({ id, title, description, children }: FormSectionCardProps) {
  return (
    <section id={id} className="br-form-section-card br-card br-anchor-target">
      <div className="br-form-section-card__header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      <div className="br-form-section-card__body">{children}</div>
    </section>
  );
}
