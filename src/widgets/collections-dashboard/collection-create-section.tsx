import Link from "next/link";

import { Button, Input } from "@/shared/ui";

import { getCollectionFeedbackMessage } from "./collection-feedback";

type CollectionAction = (formData: FormData) => Promise<void>;

type CollectionCreateSectionProps = {
  title: string;
  description: string;
  fieldPlaceholder: string;
  backHref: string;
  action: CollectionAction;
  success?: string;
  error?: string;
};

export function CollectionCreateSection({
  title,
  description,
  fieldPlaceholder,
  backHref,
  action,
  success = "",
  error = "",
}: CollectionCreateSectionProps) {
  const message = getCollectionFeedbackMessage(success, error);

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link href={backHref} className="br-button br-button--secondary">
          К списку коллекций
        </Link>
      </div>

      {message ? <div className="br-inline-notice">{message}</div> : null}

      <form action={action} className="br-owner-editor br-owner-editor--muted">
        <div className="br-owner-editor__header">
          <div>
            <strong>Новая коллекция</strong>
            <p>Название можно сразу задать под конкретного гостя.</p>
          </div>
        </div>
        <div className="br-form-grid br-form-grid--single-action">
          <Input id="collection-title" name="title" label="Название коллекции" placeholder={fieldPlaceholder} />
          <div className="br-owner-actions br-owner-actions--end">
            <Button type="submit">Создать коллекцию</Button>
          </div>
        </div>
      </form>
    </section>
  );
}
