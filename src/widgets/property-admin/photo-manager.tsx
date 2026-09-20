import Image from "next/image";

import { cn } from "@/shared/lib/cn";
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
  const sectionClass = compact
    ? "grid gap-4 border-y border-[var(--border)] py-6 scroll-mt-24 max-[720px]:py-5"
    : cn(
        "grid gap-4 rounded-[22px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98),rgb(250_246_239_/_0.96))] p-[18px] scroll-mt-24",
        "max-[720px]:rounded-[20px] max-[720px]:p-4",
      );
  const uploadFormClass = compact
    ? "grid gap-4 border-t border-[var(--border)] pt-4"
    : "grid gap-4 rounded-[20px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.96),rgb(243_248_247_/_0.86))] p-[18px] max-[720px]:rounded-[18px] max-[720px]:p-4";
  const photoGridClass = compact
    ? "grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]"
    : "grid-cols-[repeat(auto-fit,minmax(220px,1fr))]";
  const photoCardClass = compact
    ? "grid min-w-0 grid-cols-[128px_minmax(0,1fr)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.94)] max-[420px]:grid-cols-[104px_minmax(0,1fr)]"
    : "overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.94)]";
  const photoFrameClass = compact
    ? "min-h-[128px] overflow-hidden bg-[linear-gradient(180deg,rgb(255_255_255_/_0.10),rgb(17_29_27_/_0.08)),linear-gradient(135deg,#b8dbe2_0%,#88bdd0_45%,#d6e3d5_78%,#cab69d_100%)] max-[420px]:min-h-[112px]"
    : "aspect-[4/3] overflow-hidden bg-[linear-gradient(180deg,rgb(255_255_255_/_0.10),rgb(17_29_27_/_0.08)),linear-gradient(135deg,#b8dbe2_0%,#88bdd0_45%,#d6e3d5_78%,#cab69d_100%)]";

  return (
    <section id="photos" className={sectionClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold leading-[1.1] text-[var(--color-text)]">{title}</h3>
          <p className="mt-1 text-sm leading-[1.5] text-[var(--color-muted)]">{description}</p>
        </div>
      </div>

      <div className="grid gap-4">
        <form action={uploadAction} className={uploadFormClass}>
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
          <div className={cn("grid gap-4", photoGridClass)}>
            {photos.map((photo, index) => (
              <article key={photo.id} className={photoCardClass}>
                <div className={photoFrameClass}>
                  <Image
                    src={photo.url}
                    alt={`${entityTitle} — фото ${index + 1}`}
                    width={1200}
                    height={900}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className={cn("grid gap-2.5 p-4", compact && "content-between p-3")}>
                  <div className="grid gap-1">
                    <strong className={cn(compact && "text-sm leading-[1.3]")}>{index === 0 ? "Обложка" : `Фото ${index + 1}`}</strong>
                    <span className={cn("text-[13px] leading-[1.5] text-[var(--color-muted)]", compact && "text-xs")}>
                      {index === 0 ? "Показывается первым" : "Можно сделать обложкой"}
                    </span>
                  </div>
                  <div className={cn("flex flex-wrap gap-2.5", compact && "gap-2")}>
                    <form action={primaryAction} className="contents">
                      {hiddenFields.map((field) => (
                        <input key={`${photo.id}-${field.name}-primary`} type="hidden" name={field.name} value={field.value} />
                      ))}
                      <input type="hidden" name="photoId" value={photo.id} />
                      <Button type="submit" variant="secondary" size={compact ? "sm" : "md"} disabled={index === 0}>
                        {index === 0 ? "Обложка" : "Сделать обложкой"}
                      </Button>
                    </form>
                    <form action={deleteAction} className="contents">
                      {hiddenFields.map((field) => (
                        <input key={`${photo.id}-${field.name}-delete`} type="hidden" name={field.name} value={field.value} />
                      ))}
                      <input type="hidden" name="photoId" value={photo.id} />
                      <Button type="submit" variant="danger" size={compact ? "sm" : "md"}>
                        Удалить
                      </Button>
                    </form>
                  </div>
                </div>
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
