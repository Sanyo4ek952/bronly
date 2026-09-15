"use client";

import { BedDouble, Building2, Copy, ExternalLink, Layers3, Link2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { buildCollectionSubtitle } from "@/entities/collection/api/collection-formatters";
import type { CollectionChoice, CollectionDetailData } from "@/entities/collection/model/types";
import { buildCollectionPublicPath, formatDateTimeLabel } from "@/shared/lib";
import {
  AppIcon,
  BottomSheet,
  Button,
  ButtonLink,
  InlineNotice,
  Input,
  Panel,
  SectionSubtitle,
  SectionTitle,
  StatCard,
  StatusPill,
} from "@/shared/ui";

import { getCollectionFeedbackMessage } from "./collection-feedback";

type CollectionAction = (formData: FormData) => Promise<void>;
type SheetMode = "property" | "room" | null;

type CollectionDetailSectionProps = {
  title: string;
  description: string;
  backHref: string;
  pageNav?: React.ReactNode;
  data: CollectionDetailData;
  renameAction: CollectionAction;
  archiveAction: CollectionAction;
  addPropertyAction: CollectionAction;
  addRoomAction: CollectionAction;
  removeItemAction: CollectionAction;
  propertyDescription: string;
  roomDescription: string;
  success?: string;
  error?: string;
};

function getLastOpenedLabel(value: string | null) {
  return value ? formatDateTimeLabel(value) : "Пока не открывали";
}

function getItemKindLabel(kind: "property" | "room") {
  return kind === "property" ? "Объект целиком" : "Конкретный номер";
}

function getScopeLabel(scope: CollectionChoice["scope"]) {
  return scope === "collaboration" ? "Активное сотрудничество" : "Ваш вариант";
}

export function CollectionDetailSection({
  title,
  description,
  backHref,
  pageNav = null,
  data,
  renameAction,
  archiveAction,
  addPropertyAction,
  addRoomAction,
  removeItemAction,
  propertyDescription,
  roomDescription,
  success = "",
  error = "",
}: CollectionDetailSectionProps) {
  const message = getCollectionFeedbackMessage(success, error);
  const collection = data.collection;
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const publicPath = buildCollectionPublicPath(collection?.slug) ?? "";
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (copyState !== "copied") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopyState("idle"), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  if (!collection) {
    return null;
  }

  const isArchived = collection.isArchived;

  async function handleCopyLink() {
    const copyValue = new URL(publicPath, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(copyValue);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className="grid gap-4">
      {pageNav}

      <Panel className="grid gap-5" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1.5">
            <SectionTitle>{title}</SectionTitle>
            <SectionSubtitle>{description}</SectionSubtitle>
          </div>
          <ButtonLink href={backHref} variant="secondary">К списку коллекций</ButtonLink>
        </div>

        <InlineNotice tone="soft">
          Базовая статистика считает одно открытие на сессию вкладки и не собирает расширенную аналитику.
        </InlineNotice>
        {message ? <InlineNotice>{message}</InlineNotice> : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel as="article" className="grid content-start gap-5" padding="lg" surface="subtle">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-1">
                <strong>Публичная ссылка коллекции</strong>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">Гость увидит только варианты из этой персональной подборки.</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--accent)]" aria-hidden="true">
                <AppIcon icon={Link2} />
              </span>
            </div>

            <Input id="collection-public-url" label="Ссылка" value={publicPath} readOnly />

            <div className="flex flex-wrap gap-2.5">
              <Button type="button" variant="secondary" onClick={handleCopyLink}>
                <AppIcon icon={Copy} aria-hidden="true" />
                {copyState === "copied" ? "Ссылка скопирована" : "Скопировать"}
              </Button>
              <ButtonLink href={publicPath || backHref} target="_blank">
                <AppIcon icon={ExternalLink} aria-hidden="true" />
                Открыть ссылку
              </ButtonLink>
            </div>
            <p className="text-xs text-[var(--text-muted)]" aria-live="polite">
              {copyState === "error" ? "Не удалось скопировать автоматически. Выделите ссылку и скопируйте вручную." : "Ссылка действует бессрочно, пока коллекция не архивирована."}
            </p>
          </Panel>

          <Panel as="article" className="grid content-start gap-5" padding="lg" surface="subtle">
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <strong className="text-lg">{collection.title}</strong>
                <p className="text-sm text-[var(--text-muted)]">{buildCollectionSubtitle(collection.itemCount, isArchived)}</p>
              </div>
              <StatusPill variant={isArchived ? "inactive" : "active"}>{isArchived ? "Архив" : "Активна"}</StatusPill>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard title="Открытия" value={collection.viewsCount} subtitle="По публичной ссылке" />
              <StatCard title="Последнее открытие" value={getLastOpenedLabel(collection.lastOpenedAt)} subtitle="Без детальной аналитики" />
            </div>

            <form action={renameAction} className="grid gap-4">
              <input type="hidden" name="collectionId" value={collection.id} />
              <Input id="selected-collection-title" name="title" label="Название в кабинете" defaultValue={collection.title} maxLength={120} required disabled={isArchived} />
              <Input
                id="selected-collection-guest-label"
                name="guestLabel"
                label="Название для гостя"
                defaultValue={collection.guestLabel}
                description="Показывается как заголовок публичной подборки. Если пусто, используется название из кабинета."
                maxLength={160}
                disabled={isArchived}
              />
              <div className="flex flex-wrap gap-2.5">
                <Button type="submit" disabled={isArchived}>Сохранить названия</Button>
              </div>
            </form>

            <form action={archiveAction}>
              <input type="hidden" name="collectionId" value={collection.id} />
              <Button type="submit" variant="danger" disabled={isArchived}>
                {isArchived ? "Коллекция в архиве" : "Архивировать коллекцию"}
              </Button>
            </form>
          </Panel>
        </div>

        <Panel as="article" className="grid gap-5" padding="lg" surface="subtle">
          <div className="grid gap-1">
            <strong>Собрать подборку</strong>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">Добавляйте объекты или отдельные номера. Заявка всегда отправляется только на конкретный номер.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CollectionActionTile icon={Building2} title="Добавить объект" description={propertyDescription} disabled={isArchived} onClick={() => setSheetMode("property")} />
            <CollectionActionTile icon={BedDouble} title="Добавить номер" description={roomDescription} disabled={isArchived} onClick={() => setSheetMode("room")} />
          </div>

          {isArchived ? <InlineNotice tone="warning">Архивная коллекция доступна только для просмотра и базовой статистики.</InlineNotice> : null}
        </Panel>

        <Panel as="article" className="grid gap-5" padding="lg" surface="subtle">
          <div className="grid gap-1">
            <strong>Состав коллекции</strong>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">Если объект добавлен целиком, публичная страница предложит его активные номера для выбора.</p>
          </div>

          {data.items.length ? (
            <div className="grid gap-2.5">
              {data.items.map((item) => (
                <Panel key={item.id} as="article" className="flex flex-wrap items-center justify-between gap-3" padding="md">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary-soft)] font-bold text-[var(--accent)]" aria-hidden="true">{item.kind === "property" ? "О" : "Н"}</span>
                    <div className="grid min-w-0 gap-0.5">
                      <strong>{item.title}</strong>
                      <span className="text-sm text-[var(--text-muted)]">{item.subtitle}</span>
                      <span className="text-xs font-semibold text-[var(--accent)]">{getItemKindLabel(item.kind)}</span>
                    </div>
                  </div>
                  <form action={removeItemAction}>
                    <input type="hidden" name="collectionId" value={collection.id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <Button type="submit" variant="danger" size="sm" disabled={isArchived}>Удалить</Button>
                  </form>
                </Panel>
              ))}
            </div>
          ) : (
            <EmptyCollectionState icon={Plus} title="В коллекции пока нет элементов" description="Добавьте объект или номер, чтобы собрать персональную подборку для гостя." />
          )}
        </Panel>
      </Panel>

      <CollectionAddSheet
        mode={sheetMode}
        collectionId={collection.id}
        choices={sheetMode === "property" ? data.propertyChoices : data.roomChoices}
        description={sheetMode === "property" ? propertyDescription : roomDescription}
        onClose={() => setSheetMode(null)}
        action={sheetMode === "property" ? addPropertyAction : addRoomAction}
      />
    </div>
  );
}

function CollectionActionTile({ icon, title, description, disabled, onClick }: {
  icon: typeof Building2;
  title: string;
  description: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="grid min-h-36 content-center justify-items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 text-left text-[var(--text)] shadow-[var(--shadow-sm)] transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] hover:bg-[var(--color-primary-pale)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--accent)]" aria-hidden="true"><AppIcon icon={icon} /></span>
      <strong>{title}</strong>
      <span className="text-sm leading-relaxed text-[var(--text-muted)]">{description}</span>
    </button>
  );
}

function EmptyCollectionState({ icon, title, description }: { icon: typeof Layers3; title: string; description: string }) {
  return (
    <div className="grid min-h-40 place-items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-5 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--accent)]" aria-hidden="true"><AppIcon icon={icon} /></span>
      <strong>{title}</strong>
      <p className="max-w-lg text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
    </div>
  );
}

function CollectionAddSheet({ mode, collectionId, choices, description, onClose, action }: {
  mode: SheetMode;
  collectionId: string;
  choices: CollectionChoice[];
  description: string;
  onClose: () => void;
  action: CollectionAction;
}) {
  const fieldName = mode === "property" ? "propertyId" : "roomId";

  return (
    <BottomSheet
      open={Boolean(mode)}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={mode === "property" ? "Добавить объект" : "Добавить номер"}
      description={description}
      closeLabel="Закрыть выбор"
      className="sm:mx-auto sm:max-w-2xl sm:rounded-t-[22px]"
    >
      {choices.length ? (
        <div className="grid gap-2.5">
          {choices.map((item) => (
            <Panel key={item.id} as="article" className="flex flex-wrap items-center justify-between gap-3" padding="md" surface={item.isSelected ? "subtle" : "default"}>
              <div className="grid min-w-0 gap-1">
                <strong>{item.title}</strong>
                <span className="text-sm text-[var(--text-muted)]">{item.subtitle}</span>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--accent)]">
                  <span>{getScopeLabel(item.scope)}</span>
                  {item.isSelected ? <span>Уже в коллекции</span> : null}
                </div>
              </div>
              <form action={action}>
                <input type="hidden" name="collectionId" value={collectionId} />
                <input type="hidden" name={fieldName} value={item.id} />
                <Button type="submit" disabled={item.isSelected} variant={item.isSelected ? "secondary" : "primary"}>
                  {item.isSelected ? "Уже добавлено" : "Добавить"}
                </Button>
              </form>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyCollectionState icon={mode === "property" ? Building2 : BedDouble} title={mode === "property" ? "Нет доступных объектов" : "Нет доступных номеров"} description="Когда в кабинете появятся доступные варианты, их можно будет добавить в эту подборку." />
      )}
    </BottomSheet>
  );
}
