import Image from "next/image";
import { Trash2 } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { AppIcon, Button, IconButton, Input, SubmitButton } from "@/shared/ui";

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
    <section
      id="photos"
      className={cn(
        "grid gap-4 rounded-[22px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-[18px] scroll-mt-24",
        "max-[720px]:rounded-[20px] max-[720px]:p-4",
        compact && "gap-3",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">{title}</h3>
          <p className="mt-1 text-sm leading-[1.5] text-[var(--color-muted)]">{description}</p>
        </div>
      </div>

      <div className="grid gap-4">
        <form action={uploadAction} className="grid gap-4 rounded-[20px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.96),rgb(243_248_247_/_0.86))] p-[18px] max-[720px]:rounded-[18px] max-[720px]:p-4">
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
            wrapperClassName="grid max-w-[420px] gap-1.5"
          />
          <SubmitButton pendingLabel="Загрузка фото">Загрузить фото</SubmitButton>
        </form>

        {photos.length ? (
          <div
            className={cn(
              "grid",
              compact
                ? "grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(148px,1fr))]"
                : "grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4",
            )}
          >
            {photos.map((photo, index) => (
              <article
                key={photo.id}
                className={cn(
                  "overflow-hidden border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.94)]",
                  compact ? "relative aspect-square rounded-[var(--radius-lg)]" : "rounded-[20px]",
                )}
              >
                <div
                  className={cn(
                    "overflow-hidden bg-[linear-gradient(180deg,rgb(255_255_255_/_0.10),rgb(17_29_27_/_0.08)),linear-gradient(135deg,#b8dbe2_0%,#88bdd0_45%,#d6e3d5_78%,#cab69d_100%)]",
                    compact ? "h-full" : "aspect-[4/3]",
                  )}
                >
                  <Image
                    src={photo.url}
                    alt={`${entityTitle} — фото ${index + 1}`}
                    width={1200}
                    height={900}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
                {compact ? (
                  <>
                    {index === 0 ? (
                      <span className="absolute right-2 top-2 rounded-full bg-[rgb(255_255_255_/_0.94)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-text)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--accent)] hover:text-white">
                        Обложка
                      </span>
                    ) : (
                      <form action={primaryAction} className="absolute right-2 top-2">
                        {hiddenFields.map((field) => (
                          <input key={`${photo.id}-${field.name}-primary`} type="hidden" name={field.name} value={field.value} />
                        ))}
                        <input type="hidden" name="photoId" value={photo.id} />
                        <Button
                          type="submit"
                          variant="secondary"
                          size="sm"
                          className="min-h-8 rounded-full bg-[rgb(255_255_255_/_0.94)] px-2.5 shadow-[var(--shadow-sm)] hover:!border-[var(--accent)] hover:!bg-[var(--accent)] hover:!text-white"
                        >
                          На обложку
                        </Button>
                      </form>
                    )}
                    <form action={deleteAction} className="absolute bottom-2 right-2">
                      {hiddenFields.map((field) => (
                        <input key={`${photo.id}-${field.name}-delete`} type="hidden" name={field.name} value={field.value} />
                      ))}
                      <input type="hidden" name="photoId" value={photo.id} />
                      <IconButton
                        type="submit"
                        aria-label={`Удалить фото ${index + 1}`}
                        title={`Удалить фото ${index + 1}`}
                        className="size-9 border-[rgb(196_81_81_/_0.22)] bg-[rgb(255_255_255_/_0.94)] text-[var(--danger)] shadow-[var(--shadow-sm)] hover:!border-[var(--danger)] hover:!bg-[var(--danger)] hover:!text-white"
                      >
                        <AppIcon icon={Trash2} className="size-4" aria-hidden="true" />
                      </IconButton>
                    </form>
                  </>
                ) : (
                  <div className="grid gap-2.5 p-4">
                    <div className="grid gap-1">
                      <strong>{index === 0 ? "Обложка" : `Фото ${index + 1}`}</strong>
                      <span className="text-[13px] leading-[1.5] text-[var(--color-muted)]">
                        {index === 0 ? "Показывается первым" : "Можно сделать обложкой"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <form action={primaryAction} className="contents">
                        {hiddenFields.map((field) => (
                          <input key={`${photo.id}-${field.name}-primary`} type="hidden" name={field.name} value={field.value} />
                        ))}
                        <input type="hidden" name="photoId" value={photo.id} />
                        <Button type="submit" variant="secondary" disabled={index === 0}>
                          {index === 0 ? "Обложка" : "Сделать обложкой"}
                        </Button>
                      </form>
                      <form action={deleteAction} className="contents">
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
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-[1.5] text-[var(--color-muted)]">{emptyText}</p>
        )}
      </div>
    </section>
  );
}
