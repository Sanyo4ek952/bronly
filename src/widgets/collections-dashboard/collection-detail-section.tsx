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
  layout?: "default" | "owner-detail";
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
  layout = "default",
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

  if (layout === "owner-detail") {
    return (
      <OwnerCollectionDetail
        pageNav={pageNav}
        data={data}
        message={message}
        hasError={Boolean(error)}
        publicPath={publicPath}
        copyState={copyState}
        onCopyLink={handleCopyLink}
        onOpenSheet={setSheetMode}
        renameAction={renameAction}
        archiveAction={archiveAction}
        removeItemAction={removeItemAction}
        propertyDescription={propertyDescription}
        roomDescription={roomDescription}
      >
        <CollectionAddSheet
          mode={sheetMode}
          collectionId={collection.id}
          choices={sheetMode === "property" ? data.propertyChoices : data.roomChoices}
          description={sheetMode === "property" ? propertyDescription : roomDescription}
          onClose={() => setSheetMode(null)}
          action={sheetMode === "property" ? addPropertyAction : addRoomAction}
          layout="owner-detail"
        />
      </OwnerCollectionDetail>
    );
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

function OwnerCollectionDetail({
  pageNav,
  data,
  message,
  hasError,
  publicPath,
  copyState,
  onCopyLink,
  onOpenSheet,
  renameAction,
  archiveAction,
  removeItemAction,
  propertyDescription,
  roomDescription,
  children,
}: {
  pageNav: React.ReactNode;
  data: CollectionDetailData;
  message: string;
  hasError: boolean;
  publicPath: string;
  copyState: "idle" | "copied" | "error";
  onCopyLink: () => Promise<void>;
  onOpenSheet: (mode: Exclude<SheetMode, null>) => void;
  renameAction: CollectionAction;
  archiveAction: CollectionAction;
  removeItemAction: CollectionAction;
  propertyDescription: string;
  roomDescription: string;
  children: React.ReactNode;
}) {
  const collection = data.collection;

  if (!collection) {
    return null;
  }

  const isArchived = collection.isArchived;
  const copyFeedback = copyState === "error"
    ? "Не удалось скопировать автоматически. Выделите ссылку и скопируйте вручную."
    : copyState === "copied"
      ? "Ссылка скопирована."
      : isArchived
        ? "Коллекция в архиве. Ссылка сохранена для просмотра владельцем."
        : "Ссылка действует бессрочно, пока коллекция не архивирована.";

  return (
    <div className="grid min-w-0 gap-6 max-[720px]:gap-5">
      {pageNav}

      <header className="flex min-w-0 items-end justify-between gap-8 max-[1240px]:grid max-[1240px]:items-start max-[1240px]:gap-5">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-extrabold tracking-[0.115em] text-[var(--accent-strong)]">ПОДБОРКА ДЛЯ ГОСТЯ</p>
          <div className="flex min-w-0 items-start gap-3 max-[520px]:grid max-[520px]:gap-2.5">
            <h1 className="min-w-0 [overflow-wrap:anywhere] text-[clamp(36px,4vw,52px)] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--text)] max-[520px]:text-[32px]">
              {collection.title}
            </h1>
            <StatusPill className="mt-1.5 shrink-0 max-[520px]:mt-0 max-[520px]:w-fit" variant={isArchived ? "inactive" : "active"}>
              {isArchived ? "Архив" : "Активна"}
            </StatusPill>
          </div>
          <p className="mt-3 max-w-[720px] [overflow-wrap:anywhere] text-sm leading-[1.55] text-[var(--text-muted)]">
            {collection.guestLabel ? `Для гостя: ${collection.guestLabel}` : "Для гостя используется это же название."}
          </p>
          <p className="mt-1.5 max-w-[720px] [overflow-wrap:anywhere] text-[11px] font-bold leading-relaxed text-[var(--accent-strong)]">
            {publicPath}
          </p>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2.5 max-[1240px]:w-full max-[520px]:grid-cols-1">
          <Button type="button" className="min-h-[46px] px-5 max-[520px]:w-full" onClick={onCopyLink}>
            <AppIcon icon={Copy} aria-hidden="true" />
            {copyState === "copied" ? "Ссылка скопирована" : "Скопировать ссылку"}
          </Button>
          <ButtonLink href={publicPath} target="_blank" variant="secondary" className="min-h-[46px] px-5 max-[520px]:w-full">
            <AppIcon icon={ExternalLink} aria-hidden="true" />
            Открыть
          </ButtonLink>
          <p className="col-span-2 min-h-4 [overflow-wrap:anywhere] text-right text-[11px] leading-relaxed text-[var(--text-muted)] max-[1240px]:text-left max-[520px]:col-span-1" aria-live="polite">
            {copyFeedback}
          </p>
        </div>
      </header>

      {message ? <InlineNotice tone={hasError ? "error" : "default"}>{message}</InlineNotice> : null}
      {isArchived ? (
        <InlineNotice tone="warning">Подборка в архиве. Настройки и состав доступны только для просмотра.</InlineNotice>
      ) : null}

      <dl className="grid min-w-0 grid-cols-[.8fr_.8fr_1.25fr_1fr] rounded-[23px] bg-[var(--surface-muted)] px-2.5 py-[21px] shadow-[0_14px_38px_rgb(var(--color-primary-rgb)_/_0.06)] max-[1240px]:grid-cols-2 max-[1240px]:px-[13px] max-[1240px]:py-2" aria-label="Сводка по подборке">
        {[
          ["В подборке", buildCollectionSubtitle(collection.itemCount, false)],
          ["Открытий ссылки", String(collection.viewsCount)],
          ["Последнее открытие", getLastOpenedLabel(collection.lastOpenedAt)],
          [isArchived ? "Состояние ссылки" : "Пока активна", isArchived ? "Архив" : "Бессрочно"],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={`min-w-0 border-r border-[rgb(var(--color-primary-rgb)_/_0.18)] px-[22px] last:border-r-0 max-[1240px]:px-2.5 max-[1240px]:py-[13px] ${
              index === 1 ? "max-[1240px]:border-r-0" : ""
            } ${index < 2 ? "max-[1240px]:border-b" : ""}`}
          >
            <dd className="[overflow-wrap:anywhere] text-[20px] font-semibold leading-tight text-[var(--text)] max-[340px]:text-[17px]">{value}</dd>
            <dt className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="grid min-w-0 grid-cols-[minmax(0,1.55fr)_minmax(285px,.78fr)] items-start gap-5 max-[860px]:grid-cols-1">
        <section className="min-w-0 overflow-clip rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] max-[520px]:rounded-[20px]" aria-labelledby="owner-collection-items-title">
          <header className="px-[26px] pb-[19px] pt-[25px] max-[520px]:px-[18px] max-[520px]:pb-[17px] max-[520px]:pt-[21px] max-[340px]:px-[14px]">
            <h2 id="owner-collection-items-title" className="text-[21px] font-bold leading-tight tracking-[-0.025em] text-[var(--text)]">Состав подборки</h2>
            <p className="mt-1.5 [overflow-wrap:anywhere] text-xs leading-[1.55] text-[var(--text-muted)]">
              Добавьте объект целиком или конкретный отдельный номер. Заявка гостя всё равно отправляется только на выбранный номер.
            </p>
          </header>

          <div className="grid grid-cols-2 gap-2.5 px-[26px] pb-[21px] max-[520px]:px-[18px] max-[520px]:pb-[18px] max-[340px]:grid-cols-1 max-[340px]:px-[14px]">
            <OwnerCollectionAction
              icon={Building2}
              title="Добавить объект"
              description={propertyDescription}
              disabled={isArchived}
              onClick={() => onOpenSheet("property")}
            />
            <OwnerCollectionAction
              icon={BedDouble}
              title="Добавить отдельный номер"
              description={roomDescription}
              disabled={isArchived}
              onClick={() => onOpenSheet("room")}
            />
          </div>

          {data.items.length ? (
            <div className="border-t border-[var(--border)]">
              {data.items.map((item) => (
                <article key={item.id} className="grid min-h-[92px] min-w-0 grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-[var(--border)] px-[26px] py-[17px] last:border-b-0 max-[520px]:grid-cols-[38px_minmax(0,1fr)] max-[520px]:gap-2.5 max-[520px]:px-[18px] max-[340px]:px-[14px]">
                  <span className="grid size-[42px] shrink-0 place-items-center rounded-[14px] bg-[var(--surface-muted)] text-xs font-extrabold text-[var(--accent-strong)] max-[520px]:size-[38px]" aria-hidden="true">
                    {item.kind === "property" ? "О" : "Н"}
                  </span>
                  <div className="min-w-0">
                    <strong className="block [overflow-wrap:anywhere] text-sm leading-snug text-[var(--text)]">{item.title}</strong>
                    <span className="mt-1 block [overflow-wrap:anywhere] text-[11px] leading-relaxed text-[var(--text-muted)]">{item.subtitle}</span>
                    <span className="mt-1 block text-[10px] font-extrabold text-[var(--accent-strong)]">{getItemKindLabel(item.kind)}</span>
                  </div>
                  <form action={removeItemAction} className="max-[520px]:col-start-2">
                    <input type="hidden" name="collectionId" value={collection.id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <Button type="submit" variant="danger" size="sm" className="min-h-[38px]" disabled={isArchived}>Удалить</Button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <OwnerEmptyCollectionState />
          )}
        </section>

        <aside className="min-w-0 overflow-clip rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] max-[520px]:rounded-[20px]" aria-labelledby="owner-collection-settings-title">
          <div className="px-6 pb-0 pt-6 max-[520px]:px-[18px] max-[520px]:pt-[21px]">
            <h2 id="owner-collection-settings-title" className="text-[21px] font-bold leading-tight tracking-[-0.025em] text-[var(--text)]">Названия и доступ</h2>
            <p className="mt-1.5 [overflow-wrap:anywhere] text-xs leading-[1.55] text-[var(--text-muted)]">
              Внутреннее название видно в кабинете, гостевое — на публичной странице.
            </p>

            <form action={renameAction} className="mt-[18px] grid min-w-0 gap-[18px]">
              <input type="hidden" name="collectionId" value={collection.id} />
              <Input
                id="selected-collection-title"
                name="title"
                label="Название в кабинете"
                defaultValue={collection.title}
                wrapperClassName="min-w-0 [overflow-wrap:anywhere]"
                maxLength={120}
                required
                disabled={isArchived}
              />
              <Input
                id="selected-collection-guest-label"
                name="guestLabel"
                label="Название для гостя"
                defaultValue={collection.guestLabel}
                description="Если оставить пустым, используется название из кабинета."
                wrapperClassName="min-w-0 [overflow-wrap:anywhere]"
                maxLength={160}
                disabled={isArchived}
              />
              <Button type="submit" fullWidth disabled={isArchived}>Сохранить названия</Button>
            </form>
          </div>

          <p className="mt-[21px] border-t border-[var(--border)] bg-[var(--surface-muted)] px-6 py-[17px] [overflow-wrap:anywhere] text-[11px] leading-[1.55] text-[var(--text-muted)] max-[520px]:px-[18px]">
            Статистика считает открытия ссылки без профиля гостя, источников перехода и другой расширенной аналитики.
          </p>

          <div className="border-t border-[var(--border)] px-6 pb-6 pt-5 max-[520px]:px-[18px]">
            <strong className="block text-xs text-[var(--text)]">Архив подборки</strong>
            <p className="mb-3 mt-1.5 [overflow-wrap:anywhere] text-[10px] leading-[1.5] text-[var(--text-muted)]">
              После архивации ссылка перестанет показывать подборку гостю. Восстановление пока не предусмотрено.
            </p>
            <form action={archiveAction}>
              <input type="hidden" name="collectionId" value={collection.id} />
              <Button type="submit" variant="danger" fullWidth disabled={isArchived}>
                {isArchived ? "Коллекция в архиве" : "Архивировать подборку"}
              </Button>
            </form>
          </div>
        </aside>
      </div>

      {children}
    </div>
  );
}

function OwnerCollectionAction({ icon, title, description, disabled, onClick }: {
  icon: typeof Building2;
  title: string;
  description: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="grid min-h-[74px] min-w-0 grid-cols-[38px_minmax(0,1fr)] items-center gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-left text-[var(--text)] transition-colors hover:border-[rgb(var(--color-primary-rgb)_/_0.28)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:border-[rgb(var(--color-primary-rgb)_/_0.44)] focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="grid size-[38px] place-items-center rounded-[13px] bg-[var(--surface-muted)] text-[var(--accent-strong)]" aria-hidden="true"><AppIcon icon={icon} /></span>
      <span className="min-w-0">
        <strong className="block [overflow-wrap:anywhere] text-[13px] leading-snug">{title}</strong>
        <span className="mt-1 block [overflow-wrap:anywhere] text-[10px] leading-[1.4] text-[var(--text-muted)]">{description}</span>
      </span>
    </button>
  );
}

function OwnerEmptyCollectionState() {
  return (
    <div className="grid min-h-[235px] place-items-center border-t border-[var(--border)] px-7 py-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-[16px] bg-[var(--surface-muted)] text-[var(--accent-strong)]" aria-hidden="true"><AppIcon icon={Plus} /></span>
        <h3 className="mt-3.5 text-base font-bold text-[var(--text)]">В подборке пока нет вариантов</h3>
        <p className="mx-auto mt-2 max-w-md text-xs leading-[1.55] text-[var(--text-muted)]">Добавьте объект или отдельный номер, чтобы подготовить персональную ссылку для гостя.</p>
      </div>
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

function CollectionAddSheet({ mode, collectionId, choices, description, onClose, action, layout = "default" }: {
  mode: SheetMode;
  collectionId: string;
  choices: CollectionChoice[];
  description: string;
  onClose: () => void;
  action: CollectionAction;
  layout?: "default" | "owner-detail";
}) {
  const fieldName = mode === "property" ? "propertyId" : "roomId";

  if (layout === "owner-detail") {
    return (
      <BottomSheet
        open={Boolean(mode)}
        onOpenChange={(open) => { if (!open) onClose(); }}
        title={mode === "property" ? "Добавить объект" : "Добавить отдельный номер"}
        description={description}
        closeLabel="Закрыть выбор"
        className="sm:mx-auto sm:max-w-2xl sm:rounded-t-[22px]"
      >
        {choices.length ? (
          <div className="grid gap-2.5">
            {choices.map((item) => (
              <article
                key={item.id}
                className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 rounded-[16px] border border-[var(--border)] p-4 max-[520px]:grid-cols-1 max-[360px]:p-3 ${
                  item.isSelected ? "bg-[var(--surface-muted)]" : "bg-[var(--surface)]"
                }`}
              >
                <div className="min-w-0">
                  <strong className="block [overflow-wrap:anywhere] text-sm leading-snug text-[var(--text)]">{item.title}</strong>
                  <span className="mt-1 block [overflow-wrap:anywhere] text-[11px] leading-relaxed text-[var(--text-muted)]">{item.subtitle}</span>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-extrabold text-[var(--accent-strong)]">
                    <span>{getScopeLabel(item.scope)}</span>
                    {item.isSelected ? <span>Уже в подборке</span> : null}
                  </div>
                </div>
                <form action={action} className="max-[520px]:w-full">
                  <input type="hidden" name="collectionId" value={collectionId} />
                  <input type="hidden" name={fieldName} value={item.id} />
                  <Button type="submit" className="max-[520px]:w-full" disabled={item.isSelected} variant={item.isSelected ? "secondary" : "primary"}>
                    {item.isSelected ? "Уже добавлено" : "Добавить"}
                  </Button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-44 place-items-center px-4 py-6 text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-[16px] bg-[var(--surface-muted)] text-[var(--accent-strong)]" aria-hidden="true">
                <AppIcon icon={mode === "property" ? Building2 : BedDouble} />
              </span>
              <h3 className="mt-3.5 text-base font-bold text-[var(--text)]">{mode === "property" ? "Нет доступных объектов" : "Нет доступных номеров"}</h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-[1.55] text-[var(--text-muted)]">Когда в кабинете появятся доступные варианты, их можно будет добавить в эту подборку.</p>
            </div>
          </div>
        )}
      </BottomSheet>
    );
  }

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
