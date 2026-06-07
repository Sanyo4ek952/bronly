"use client";

import { BedDouble, Building2, Copy, ExternalLink, Layers3, Link2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { CollectionChoice, CollectionDetailData } from "@/entities/collection";
import { buildCollectionPublicPath, formatDateTimeLabel } from "@/shared/lib";
import { AppIcon, Button, Input, StatusPill } from "@/shared/ui";

import { getCollectionFeedbackMessage } from "./collection-feedback";

type CollectionAction = (formData: FormData) => Promise<void>;
type SheetMode = "property" | "room" | null;

type CollectionDetailSectionProps = {
  title: string;
  description: string;
  backHref: string;
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

function buildCollectionSubtitle(itemCount: number, isArchived: boolean) {
  const itemLabel =
    itemCount % 10 === 1 && itemCount % 100 !== 11
      ? "элемент"
      : itemCount % 10 >= 2 && itemCount % 10 <= 4 && (itemCount % 100 < 12 || itemCount % 100 > 14)
        ? "элемента"
        : "элементов";

  return `${itemCount} ${itemLabel}${isArchived ? " · архив" : ""}`;
}

function getItemKindLabel(kind: "property" | "room") {
  return kind === "property" ? "Объект целиком" : "Конкретный номер";
}

function getScopeLabel(scope: CollectionChoice["scope"]) {
  return scope === "collaboration" ? "Активное сотрудничество" : "Ваш объект";
}

function getSheetTitle(mode: Exclude<SheetMode, null>) {
  return mode === "property" ? "Добавить объект" : "Добавить номер";
}

function getSheetDescription(
  mode: Exclude<SheetMode, null>,
  propertyDescription: string,
  roomDescription: string,
) {
  return mode === "property" ? propertyDescription : roomDescription;
}

export function CollectionDetailSection({
  title,
  description,
  backHref,
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
    if (!sheetMode) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSheetMode(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [sheetMode]);

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
  const hasChoices = Boolean(data.propertyChoices.length || data.roomChoices.length);

  async function handleCopyLink() {
    const copyValue =
      typeof window !== "undefined" && publicPath ? new URL(publicPath, window.location.origin).toString() : publicPath;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyValue);
        setCopyState("copied");
        return;
      }
    } catch {
      // Fall back to an error state when clipboard access is blocked.
    }

    setCopyState("error");
  }

  return (
    <>
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

        <div className="br-inline-notice br-inline-notice--soft">
          В кабинете показывается базовая статистика по публичной ссылке коллекции: количество открытий и время
          последнего открытия без расширенной аналитики.
        </div>

        {message ? <div className="br-inline-notice">{message}</div> : null}

        <div className="br-owner-stack">
          <div className="br-collection-detail-grid">
            <article className="br-owner-editor br-collection-link-card">
              <div className="br-owner-editor__header">
                <div>
                  <strong>Публичная ссылка коллекции</strong>
                  <p>Эту ссылку можно отправить гостю. Гость увидит только варианты из этой подборки.</p>
                </div>
                <span className="br-collection-link-card__icon" aria-hidden="true">
                  <AppIcon icon={Link2} />
                </span>
              </div>

              <Input
                id="collection-public-url"
                label="Ссылка"
                value={publicPath}
                readOnly
                className="br-collection-link-card__field"
              />

              <div className="br-owner-actions">
                <Button type="button" variant="secondary" onClick={handleCopyLink}>
                  {copyState === "copied" ? "Ссылка скопирована" : "Скопировать ссылку"}
                </Button>
                <Link href={publicPath || backHref} className="br-button br-button--primary" target="_blank">
                  Открыть ссылку
                </Link>
              </div>

              {copyState === "error" ? (
                <p className="br-owner-muted">Не удалось скопировать автоматически. Можно выделить ссылку и скопировать вручную.</p>
              ) : null}
            </article>

            <article className="br-owner-editor">
              <div className="br-owner-editor__header">
                <div>
                  <strong>{collection.title}</strong>
                  <p>{buildCollectionSubtitle(collection.itemCount, isArchived)}</p>
                </div>
                <StatusPill variant={isArchived ? "inactive" : "active"}>
                  {isArchived ? "Архив" : "Активна"}
                </StatusPill>
              </div>

              <div className="br-collection-stats-grid">
                <article className="br-stat-card br-card">
                  <span>Открытия</span>
                  <strong>{collection.viewsCount}</strong>
                  <small>По публичной ссылке коллекции</small>
                </article>
                <article className="br-stat-card br-card">
                  <span>Последнее открытие</span>
                  <strong>{getLastOpenedLabel(collection.lastOpenedAt)}</strong>
                  <small>Обновляется без детальной аналитики</small>
                </article>
              </div>

              <form action={renameAction} className="br-owner-stack">
                <input type="hidden" name="collectionId" value={collection.id} />
                <Input
                  id="selected-collection-title"
                  name="title"
                  label="Название коллекции"
                  defaultValue={collection.title}
                />
                <div className="br-owner-actions">
                  <Button type="submit" disabled={isArchived}>
                    Сохранить название
                  </Button>
                </div>
              </form>

              <form action={archiveAction}>
                <input type="hidden" name="collectionId" value={collection.id} />
                <Button type="submit" variant="danger" disabled={isArchived}>
                  {isArchived ? "Коллекция в архиве" : "Архивировать коллекцию"}
                </Button>
              </form>
            </article>
          </div>

          <article className="br-owner-editor">
            <div className="br-owner-editor__header">
              <div>
                <strong>Собрать подборку</strong>
                <p>Добавляйте объекты или отдельные номера. Гость все равно отправляет заявку только на конкретный номер.</p>
              </div>
            </div>

            <div className="br-collection-actions-grid">
              <button
                type="button"
                className="br-collection-action-tile"
                disabled={isArchived}
                onClick={() => setSheetMode("property")}
              >
                <span className="br-collection-action-tile__icon" aria-hidden="true">
                  <AppIcon icon={Building2} />
                </span>
                <strong>Добавить объект</strong>
                <span>{propertyDescription}</span>
              </button>

              <button
                type="button"
                className="br-collection-action-tile"
                disabled={isArchived}
                onClick={() => setSheetMode("room")}
              >
                <span className="br-collection-action-tile__icon" aria-hidden="true">
                  <AppIcon icon={BedDouble} />
                </span>
                <strong>Добавить номер</strong>
                <span>{roomDescription}</span>
              </button>
            </div>

            {isArchived ? (
              <p className="br-owner-muted">Архивная коллекция доступна только для просмотра и базовой статистики.</p>
            ) : null}

            {!hasChoices ? (
              <article className="br-empty-card br-card br-collection-inline-empty">
                <div className="br-empty-card__art" aria-hidden="true">
                  <AppIcon icon={Layers3} />
                </div>
                <strong>Пока нечего добавлять</strong>
                <p>Когда в кабинете появятся доступные объекты и номера, их можно будет включить в эту коллекцию.</p>
              </article>
            ) : null}
          </article>

          <article className="br-owner-editor">
            <div className="br-owner-editor__header">
              <div>
                <strong>Состав коллекции</strong>
                <p>Даже если в подборку добавлен объект целиком, гость перед отправкой заявки выбирает конкретный номер.</p>
              </div>
            </div>

            {data.items.length ? (
              <div className="br-requests-list">
                {data.items.map((item) => (
                  <article key={item.id} className="br-request-item br-request-item--static">
                    <div className="br-request-item__avatar">{item.kind === "property" ? "О" : "Н"}</div>
                    <div className="br-request-item__body">
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                      <span>{getItemKindLabel(item.kind)}</span>
                    </div>
                    <form action={removeItemAction}>
                      <input type="hidden" name="collectionId" value={collection.id} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <Button type="submit" variant="danger" disabled={isArchived}>
                        Удалить
                      </Button>
                    </form>
                  </article>
                ))}
              </div>
            ) : (
              <article className="br-empty-card br-card">
                <div className="br-empty-card__art" aria-hidden="true">
                  <AppIcon icon={Plus} />
                </div>
                <strong>В коллекции пока нет элементов</strong>
                <p>Нажмите «Добавить объект» или «Добавить номер», чтобы собрать подборку по отдельной ссылке для гостя.</p>
              </article>
            )}
          </article>
        </div>
      </section>

      {sheetMode ? (
        <CollectionAddSheet
          mode={sheetMode}
          collectionId={collection.id}
          isArchived={isArchived}
          propertyDescription={propertyDescription}
          roomDescription={roomDescription}
          choices={sheetMode === "property" ? data.propertyChoices : data.roomChoices}
          onClose={() => setSheetMode(null)}
          action={sheetMode === "property" ? addPropertyAction : addRoomAction}
        />
      ) : null}
    </>
  );
}

type CollectionAddSheetProps = {
  mode: Exclude<SheetMode, null>;
  collectionId: string;
  isArchived: boolean;
  choices: CollectionChoice[];
  propertyDescription: string;
  roomDescription: string;
  onClose: () => void;
  action: CollectionAction;
};

function CollectionAddSheet({
  mode,
  collectionId,
  isArchived,
  choices,
  propertyDescription,
  roomDescription,
  onClose,
  action,
}: CollectionAddSheetProps) {
  const fieldName = mode === "property" ? "propertyId" : "roomId";

  return (
    <div className="br-collection-sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="br-collection-sheet br-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`collection-sheet-title-${mode}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="br-collection-sheet__header">
          <div>
            <h3 id={`collection-sheet-title-${mode}`}>{getSheetTitle(mode)}</h3>
            <p>{getSheetDescription(mode, propertyDescription, roomDescription)}</p>
          </div>
          <button type="button" className="br-collection-sheet__close" aria-label="Закрыть" onClick={onClose}>
            <X />
          </button>
        </div>

        {choices.length ? (
          <div className="br-collection-sheet__list">
            {choices.map((item) => (
              <article
                key={item.id}
                className={`br-collection-choice ${item.isSelected ? "br-collection-choice--selected" : ""}`}
              >
                <div className="br-collection-choice__copy">
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                  <div className="br-collection-choice__meta">
                    <span>{getScopeLabel(item.scope)}</span>
                    {item.isSelected ? <span>Уже в коллекции</span> : null}
                  </div>
                </div>

                <form action={action}>
                  <input type="hidden" name="collectionId" value={collectionId} />
                  <input type="hidden" name={fieldName} value={item.id} />
                  <Button type="submit" disabled={isArchived || item.isSelected} variant={item.isSelected ? "secondary" : "primary"}>
                    {item.isSelected ? "Уже добавлено" : "Добавить"}
                  </Button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <article className="br-empty-card br-card br-collection-sheet__empty">
            <div className="br-empty-card__art" aria-hidden="true">
              <AppIcon icon={mode === "property" ? Building2 : BedDouble} />
            </div>
            <strong>{mode === "property" ? "Нет доступных объектов" : "Нет доступных номеров"}</strong>
            <p>Когда в кабинете появятся доступные варианты, их можно будет быстро добавить в эту подборку.</p>
          </article>
        )}
      </section>
    </div>
  );
}
