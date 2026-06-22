import Image from "next/image";

import { Button, Input, SubmitButton } from "@/shared/ui";

type ServerFormAction = (formData: FormData) => void | Promise<void>;

type PhotoItem = {
  id: string;
  url: string;
};

type HiddenField = {
  name: string;
  value: string;
};

type PhotoManagerProps = {
  title: string;
  description: string;
  emptyText: string;
  photos: PhotoItem[];
  uploadAction: ServerFormAction;
  primaryAction: ServerFormAction;
  deleteAction: ServerFormAction;
  hiddenFields: HiddenField[];
  uploadInputId: string;
  uploadLabel: string;
  uploadDescription: string;
  entityTitle: string;
  compact?: boolean;
};

export function PhotoManager({
  title,
  description,
  emptyText,
  photos,
  uploadAction,
  primaryAction,
  deleteAction,
  hiddenFields,
  uploadInputId,
  uploadLabel,
  uploadDescription,
  entityTitle,
  compact = false,
}: PhotoManagerProps) {
  return (
    <section id="photos" className={`br-form-section-card br-card br-anchor-target${compact ? " br-form-section-card--compact" : ""}`}>
      <div className="br-form-section-card__header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      <div className="br-form-section-card__body">
        <form action={uploadAction} className="br-owner-photo-upload">
          {hiddenFields.map((field) => (
            <input key={field.name} type="hidden" name={field.name} value={field.value} />
          ))}
          <Input
            id={uploadInputId}
            name="photos"
            type="file"
            accept="image/*"
            multiple
            label={uploadLabel}
            description={uploadDescription}
            wrapperClassName="br-owner-photo-upload__field"
          />
          <SubmitButton pendingLabel="Загрузка фото">Загрузить фото</SubmitButton>
        </form>

        {photos.length ? (
          <div className={`br-photo-grid${compact ? " br-photo-grid--compact" : ""}`}>
            {photos.map((photo, index) => (
              <article key={photo.id} className="br-photo-card">
                <div className="br-photo-card__media">
                  <Image
                    src={photo.url}
                    alt={`${entityTitle} — фото ${index + 1}`}
                    width={1200}
                    height={900}
                    unoptimized
                    className="br-photo-card__image"
                  />
                </div>
                <div className="br-photo-card__body">
                  <div className="br-photo-card__meta">
                    <strong>{index === 0 ? "Обложка" : `Фото ${index + 1}`}</strong>
                    <span>{index === 0 ? "Показывается первым" : "Можно сделать обложкой"}</span>
                  </div>
                  <div className="br-photo-card__actions">
                    <form action={primaryAction}>
                      {hiddenFields.map((field) => (
                        <input key={`${photo.id}-${field.name}-primary`} type="hidden" name={field.name} value={field.value} />
                      ))}
                      <input type="hidden" name="photoId" value={photo.id} />
                      <Button type="submit" variant="secondary" disabled={index === 0}>
                        {index === 0 ? "Обложка" : "Сделать обложкой"}
                      </Button>
                    </form>
                    <form action={deleteAction}>
                      {hiddenFields.map((field) => (
                        <input key={`${photo.id}-${field.name}-delete`} type="hidden" name={field.name} value={field.value} />
                      ))}
                      <input type="hidden" name="photoId" value={photo.id} />
                      <Button type="submit" variant="danger">
                        Удалить
                      </Button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="br-owner-muted">{emptyText}</p>
        )}
      </div>
    </section>
  );
}
