"use client";

import { ArrowRight, ChevronDown, ExternalLink, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type {
  AdminOverviewData,
  AdminPropertiesPageData,
  AdminPropertyItem,
  AdminReviewsPageData,
  AdminSubscriptionItem,
  AdminSubscriptionsPageData,
  AdminUserItem,
  AdminUsersPageData,
} from "@/entities/admin";
import type { ReferralQueueItem } from "@/entities/referral";
import { formatDateLabel, formatDateTimeLabel } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";
import { AppIcon, Button, InlineNotice, Input, Select } from "@/shared/ui";

import {
  extendSubscriptionAction,
  reviewReferralRewardAction,
  saveSubscriptionAction,
  toggleProfilePublicVisibilityAction,
  togglePropertyFreezeAction,
} from "@/app/admin/actions";

function getShortProfileId(profileId: string) {
  return profileId.slice(0, 8);
}

function isExpiringSoon(value: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  return date >= now && date <= nextWeek;
}

function getSubscriptionFocusKey(row: ReferralQueueItem) {
  const roleContext = row.inviterRoles.includes("owner") ? "owner" : "agent";
  return `${row.inviterProfileId}:${roleContext}`;
}

function getSubscriptionAnchorId(profileId: string, roleContext: "owner" | "agent") {
  return `subscription-${profileId}-${roleContext}`;
}

function getSubscriptionStatusVariant(status: AdminSubscriptionItem["status"]) {
  switch (status) {
    case "active":
    case "manual":
      return "active";
    case "grace":
      return "attention";
    case "expired":
      return "danger";
    default:
      return "neutral";
  }
}

function getPropertyStatusLabel(row: AdminPropertyItem) {
  if (row.isFrozen) {
    return "Заморожен";
  }

  return row.published ? "Опубликован" : "Скрыт";
}

function getPropertyStatusVariant(row: AdminPropertyItem) {
  if (row.isFrozen) {
    return "danger";
  }

  return row.published ? "active" : "neutral";
}

function getUserVisibilityLabel(row: AdminUserItem) {
  if (!row.publicPageUrls.length) {
    return "Без публичной ссылки";
  }

  return row.isPublicHiddenByAdmin ? "Скрыты админом" : "Публичные страницы доступны";
}

function getUserVisibilityVariant(row: AdminUserItem) {
  if (!row.publicPageUrls.length) {
    return "neutral";
  }

  return row.isPublicHiddenByAdmin ? "danger" : "active";
}

type AdminBadgeTone = "active" | "danger" | "attention" | "neutral";

function AdminBadge({ children, tone }: { children: React.ReactNode; tone: AdminBadgeTone }) {
  return <span className={cn("br-admin-badge", `br-admin-badge--${tone}`)}>{children}</span>;
}

function AdminAccordion({
  title,
  subtitle,
  defaultOpen = false,
  rightSlot = null,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="br-admin-accordion" data-open={isOpen ? "true" : "false"}>
      <button
        type="button"
        className="br-admin-accordion__trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="br-admin-accordion__copy">
          <strong>{title}</strong>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
        <span className="br-admin-accordion__right">
          {rightSlot}
          <ChevronDown className="br-admin-accordion__chevron" aria-hidden="true" />
        </span>
      </button>
      {isOpen ? (
        <div id={panelId} className="br-admin-accordion__body">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function AdminFilterChips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="br-admin-filter-chips" role="tablist" aria-label="Фильтры">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "br-admin-filter-chip",
            value === option.value && "br-admin-filter-chip--active",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function AdminPageHeader({
  title,
  description,
  actions = null,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="br-admin-page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="br-admin-page-header__actions">{actions}</div> : null}
    </section>
  );
}

function AdminSummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="br-admin-summary-card br-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

function AdminPreviewCard({
  title,
  description,
  href,
  count,
  children,
}: {
  title: string;
  description: string;
  href: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <article className="br-admin-preview-card br-card">
      <div className="br-admin-preview-card__header">
        <div>
          <strong>{title}</strong>
          <p>{description}</p>
        </div>
        <AdminBadge tone={count > 0 ? "attention" : "neutral"}>{count}</AdminBadge>
      </div>
      <div className="br-admin-preview-card__body">{children}</div>
      <Link href={href} className="br-admin-inline-link">
        Открыть раздел
        <ArrowRight aria-hidden="true" />
      </Link>
    </article>
  );
}

function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="br-admin-empty br-card">
      <div className="br-admin-empty__icon" aria-hidden="true">
        <AppIcon icon={Shield} />
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
    </article>
  );
}

function AdminPreviewList({
  items,
}: {
  items: Array<{
    title: string;
    subtitle: string;
    badge?: { label: string; tone: AdminBadgeTone };
  }>;
}) {
  if (!items.length) {
    return <p className="br-admin-muted">Сейчас здесь пусто.</p>;
  }

  return (
    <div className="br-admin-preview-list">
      {items.map((item) => (
        <article key={`${item.title}-${item.subtitle}`} className="br-admin-preview-list__item">
          <div>
            <strong>{item.title}</strong>
            <span>{item.subtitle}</span>
          </div>
          {item.badge ? <AdminBadge tone={item.badge.tone}>{item.badge.label}</AdminBadge> : null}
        </article>
      ))}
    </div>
  );
}

export function AdminOverview({ data, message }: { data: AdminOverviewData; message: string }) {
  const peopleStats = [
    { label: "Пользователи", value: String(data.userCount), hint: "Все профили с доступом в сервис" },
    { label: "Владельцы", value: String(data.ownerCount), hint: "Кабинеты owner" },
    { label: "Агенты", value: String(data.agentCount), hint: "Активные agent-роли" },
    { label: "Две роли", value: String(data.dualRoleCount), hint: "Owner и agent в одном профиле" },
  ];

  const subscriptionStats = [
    { label: "Активные подписки", value: String(data.activeSubscriptionCount), hint: "Статусы active или manual" },
    { label: "Платящие сейчас", value: String(data.paidUserCount), hint: "Уникальные профили с доступом" },
    { label: "Скоро истекают", value: String(data.expiringSoonCount), hint: "Нужна ручная проверка" },
    { label: "В очереди referral", value: String(data.pendingReferralCount), hint: "Ожидают решения админа" },
  ];

  const activityStats = [
    { label: "Объекты", value: String(data.propertyCount), hint: "Все созданные объекты" },
    { label: "Номера", value: String(data.roomCount), hint: "Активные и неактивные варианты" },
    { label: "Заявки", value: String(data.requestCount), hint: "Всего запросов на проживание" },
    { label: "Коллекции", value: String(data.collectionCount), hint: "Owner и agent подборки" },
  ];

  return (
    <section className="br-admin-page">
      <AdminPageHeader
        title="Админка Bronly"
        description="Мобильная сводка по пользователям, подпискам и внутренним проверкам."
        actions={
          <>
            <Link href="/admin/reviews" className="br-button br-button--primary">
              Проверки
            </Link>
            <Link href="/admin/subscriptions" className="br-button br-button--secondary">
              Подписки
            </Link>
          </>
        }
      />

      {message ? (
        <InlineNotice title="Статус действия" aria-live="polite">
          <span>{message}</span>
        </InlineNotice>
      ) : null}

      <section className="br-admin-summary-group">
        <div className="br-admin-summary-group__header">
          <h2>Пользователи</h2>
          <p>Кого сейчас обслуживает платформа.</p>
        </div>
        <div className="br-admin-summary-grid">
          {peopleStats.map((item) => (
            <AdminSummaryCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="br-admin-summary-group">
        <div className="br-admin-summary-group__header">
          <h2>Подписки</h2>
          <p>Что требует ручного продления и внимания.</p>
        </div>
        <div className="br-admin-summary-grid">
          {subscriptionStats.map((item) => (
            <AdminSummaryCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="br-admin-summary-group">
        <div className="br-admin-summary-group__header">
          <h2>Активность</h2>
          <p>Объекты, номера и поток заявок.</p>
        </div>
        <div className="br-admin-summary-grid">
          {activityStats.map((item) => (
            <AdminSummaryCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="br-admin-preview-grid">
        <AdminPreviewCard
          title="Очередь проверок"
          description="Referral-бонусы, которые нужно подтвердить или отклонить."
          href="/admin/reviews"
          count={data.pendingReferralCount}
        >
          <AdminPreviewList
            items={data.pendingReferralRewards.map((item) => ({
              title: `${item.inviterName} → ${item.invitedName}`,
              subtitle: `${item.milestoneLabel} · ${item.milestoneReachedAt}`,
              badge: { label: `+${item.rewardDays} дней`, tone: "attention" },
            }))}
          />
        </AdminPreviewCard>

        <AdminPreviewCard
          title="Скоро истекают"
          description="Подписки, где нужен быстрый переход к продлению."
          href="/admin/subscriptions"
          count={data.expiringSoonCount}
        >
          <AdminPreviewList
            items={data.expiringSubscriptions.map((item) => ({
              title: `${item.displayName} · ${item.roleContext}`,
              subtitle: item.validUntil ? `Доступ до ${formatDateLabel(item.validUntil)}` : "Дата не указана",
              badge: { label: item.statusLabel, tone: getSubscriptionStatusVariant(item.status) },
            }))}
          />
        </AdminPreviewCard>

        <AdminPreviewCard
          title="Скрытые страницы"
          description="Owner и agent профили, скрытые администратором."
          href="/admin/users"
          count={data.hiddenProfileCount}
        >
          <AdminPreviewList
            items={data.hiddenUsers.map((item) => ({
              title: item.displayName,
              subtitle: item.roles.join(", ") || "owner",
              badge: { label: "Скрыты", tone: "danger" },
            }))}
          />
        </AdminPreviewCard>

        <AdminPreviewCard
          title="Замороженные объекты"
          description="Объекты с ограничением показа из админки."
          href="/admin/properties"
          count={data.frozenPropertyCount}
        >
          <AdminPreviewList
            items={data.frozenProperties.map((item) => ({
              title: item.title,
              subtitle: `${item.ownerName} · ${item.activeRoomCount}/${item.totalRoomCount} номеров`,
              badge: { label: "Заморожен", tone: "danger" },
            }))}
          />
        </AdminPreviewCard>
      </section>
    </section>
  );
}

export function AdminReviewsPage({ data, message }: { data: AdminReviewsPageData; message: string }) {
  return (
    <section className="br-admin-page">
      <AdminPageHeader
        title="Проверки"
        description="Решения по referral-продлениям и быстрый переход к нужной подписке."
      />

      {message ? (
        <InlineNotice title="Статус действия" aria-live="polite">
          <span>{message}</span>
        </InlineNotice>
      ) : null}

      {data.pendingReferralRewards.length ? (
        <div className="br-admin-list">
          {data.pendingReferralRewards.map((row) => (
            <article key={row.rewardId} className="br-admin-record-card br-card">
              <div className="br-admin-record-card__top">
                <div>
                  <strong>{row.inviterName}</strong>
                  <p>{row.invitedName}</p>
                </div>
                <AdminBadge tone="attention">+{row.rewardDays} дней</AdminBadge>
              </div>

              <div className="br-admin-record-card__stats">
                <div>
                  <span>Milestone</span>
                  <strong>{row.milestoneLabel}</strong>
                </div>
                <div>
                  <span>Когда достигнут</span>
                  <strong>{row.milestoneReachedAt}</strong>
                </div>
              </div>

              <AdminAccordion
                title="Подробнее"
                subtitle="Показать роли, профиль и быстрый переход к подписке."
              >
                <div className="br-admin-detail-grid">
                  <div>
                    <span>Роли пригласившего</span>
                    <strong>{row.inviterRoles.join(", ") || "owner"}</strong>
                  </div>
                  <div>
                    <span>Профиль</span>
                    <strong>id {getShortProfileId(row.inviterProfileId)}</strong>
                  </div>
                </div>
                <Link
                  href={`/admin/subscriptions?focus=${encodeURIComponent(getSubscriptionFocusKey(row))}`}
                  className="br-admin-inline-link"
                >
                  Перейти к подписке
                  <ArrowRight aria-hidden="true" />
                </Link>
              </AdminAccordion>

              <div className="br-admin-sticky-actions">
                <form action={reviewReferralRewardAction}>
                  <input type="hidden" name="rewardId" value={row.rewardId} />
                  <input type="hidden" name="decision" value="approved" />
                  <Button type="submit" fullWidth>
                    Подтвердить
                  </Button>
                </form>
                <form action={reviewReferralRewardAction}>
                  <input type="hidden" name="rewardId" value={row.rewardId} />
                  <input type="hidden" name="decision" value="rejected" />
                  <Button type="submit" variant="secondary" fullWidth>
                    Отклонить
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="Очередь проверок пуста"
          description="Новых referral-продлений для ручного подтверждения пока нет."
        />
      )}
    </section>
  );
}

type UserFilter = "all" | "owner" | "agent" | "dual" | "hidden";

export function AdminUsersPage({ data, message }: { data: AdminUsersPageData; message: string }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.users.filter((row) => {
      if (filter === "owner" && !row.roles.includes("owner")) {
        return false;
      }

      if (filter === "agent" && !row.roles.includes("agent")) {
        return false;
      }

      if (filter === "dual" && !(row.roles.includes("owner") && row.roles.includes("agent"))) {
        return false;
      }

      if (filter === "hidden" && !row.isPublicHiddenByAdmin) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [row.displayName, row.slug, row.phone, row.profileId].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [data.users, filter, search]);

  return (
    <section className="br-admin-page">
      <AdminPageHeader
        title="Пользователи"
        description="Роли, контакты, публичные ссылки и ручное скрытие страниц."
      />

      {message ? (
        <InlineNotice title="Статус действия" aria-live="polite">
          <span>{message}</span>
        </InlineNotice>
      ) : null}

      <section className="br-admin-toolbar br-card">
        <Input
          id="admin-users-search"
          label="Поиск"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Имя, slug, телефон или id"
          wrapperClassName="br-admin-toolbar__search"
        />
        <AdminFilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { label: "Все", value: "all" },
            { label: "Owner", value: "owner" },
            { label: "Agent", value: "agent" },
            { label: "2 роли", value: "dual" },
            { label: `Скрыты (${data.hiddenProfileCount})`, value: "hidden" },
          ]}
        />
      </section>

      {filteredUsers.length ? (
        <div className="br-admin-list">
          {filteredUsers.map((row) => (
            <AdminAccordion
              key={row.profileId}
              title={row.displayName}
              subtitle={`${row.roles.join(", ") || "owner"} · ${row.requestCount} заявок`}
              rightSlot={<AdminBadge tone={getUserVisibilityVariant(row)}>{getUserVisibilityLabel(row)}</AdminBadge>}
            >
              <div className="br-admin-detail-grid">
                <div>
                  <span>Профиль</span>
                  <strong>id {getShortProfileId(row.profileId)}</strong>
                </div>
                <div>
                  <span>Создан</span>
                  <strong>{row.createdAt ? formatDateTimeLabel(row.createdAt) : "Не задано"}</strong>
                </div>
                <div>
                  <span>Контакт</span>
                  <strong>{row.phone || "Не указан"}</strong>
                </div>
                <div>
                  <span>Объекты</span>
                  <strong>{row.propertyCount}</strong>
                </div>
              </div>

              <div className="br-admin-links-stack">
                {row.publicPageUrls.length ? (
                  row.publicPageUrls.map((link) => (
                    <Link key={link} href={link} className="br-admin-external-link" target="_blank">
                      <span>{link}</span>
                      <ExternalLink aria-hidden="true" />
                    </Link>
                  ))
                ) : (
                  <p className="br-admin-muted">Публичные ссылки ещё не созданы.</p>
                )}
              </div>

              {row.publicPageUrls.length ? (
                <div className="br-admin-card-actions">
                  <form action={toggleProfilePublicVisibilityAction}>
                    <input type="hidden" name="profileId" value={row.profileId} />
                    <input
                      type="hidden"
                      name="nextHidden"
                      value={row.isPublicHiddenByAdmin ? "false" : "true"}
                    />
                    <Button type="submit" variant="secondary" fullWidth>
                      {row.isPublicHiddenByAdmin ? "Вернуть страницы" : "Скрыть страницы"}
                    </Button>
                  </form>
                </div>
              ) : null}
            </AdminAccordion>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="Ничего не найдено"
          description="Измените фильтр или строку поиска, чтобы увидеть нужные профили."
        />
      )}
    </section>
  );
}

type SubscriptionStatusFilter = "all" | "expiring" | "grace" | "active" | "expired";
type SubscriptionContextFilter = "all" | "owner" | "agent";

export function AdminSubscriptionsPage({
  data,
  message,
  focusKey = "",
}: {
  data: AdminSubscriptionsPageData;
  message: string;
  focusKey?: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatusFilter>("all");
  const [contextFilter, setContextFilter] = useState<SubscriptionContextFilter>("all");
  const [openKey, setOpenKey] = useState(() => focusKey);
  const focusedCardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!focusKey || !focusedCardRef.current) {
      return;
    }

    focusedCardRef.current.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [focusKey, openKey]);

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.subscriptions.filter((row) => {
      if (contextFilter !== "all" && row.roleContext !== contextFilter) {
        return false;
      }

      if (statusFilter === "expiring" && !isExpiringSoon(row.validUntil)) {
        return false;
      }

      if (statusFilter === "grace" && row.status !== "grace") {
        return false;
      }

      if (statusFilter === "active" && row.status !== "active" && row.status !== "manual") {
        return false;
      }

      if (statusFilter === "expired" && row.status !== "expired") {
        return false;
      }

      if (!query) {
        return true;
      }

      return [row.displayName, row.slug, row.profileId, row.planName, row.roleContext].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [contextFilter, data.subscriptions, search, statusFilter]);

  return (
    <section className="br-admin-page">
      <AdminPageHeader
        title="Подписки"
        description="Главный рабочий экран для продления доступа и ручной корректировки статусов."
      />

      {message ? (
        <InlineNotice title="Статус действия" aria-live="polite">
          <span>{message}</span>
        </InlineNotice>
      ) : null}

      <section className="br-admin-toolbar br-card">
        <Input
          id="admin-subscriptions-search"
          label="Поиск"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Имя, slug, профиль или план"
          wrapperClassName="br-admin-toolbar__search"
        />
        <AdminFilterChips
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Все", value: "all" },
            { label: `Скоро истекают (${data.expiringSoonCount})`, value: "expiring" },
            { label: "Grace", value: "grace" },
            { label: `Active (${data.activeSubscriptionCount})`, value: "active" },
            { label: "Expired", value: "expired" },
          ]}
        />
        <AdminFilterChips
          value={contextFilter}
          onChange={setContextFilter}
          options={[
            { label: "Все контексты", value: "all" },
            { label: "Owner", value: "owner" },
            { label: "Agent", value: "agent" },
          ]}
        />
      </section>

      {filteredSubscriptions.length ? (
        <div className="br-admin-list">
          {filteredSubscriptions.map((row) => {
            const cardKey = `${row.profileId}:${row.roleContext}`;
            const isOpen = openKey === cardKey;

            return (
              <article
                key={cardKey}
                id={getSubscriptionAnchorId(row.profileId, row.roleContext)}
                ref={focusKey === cardKey ? focusedCardRef : undefined}
                className={cn("br-admin-record-card br-card", isOpen && "br-admin-record-card--focused")}
              >
                <button
                  type="button"
                  className="br-admin-record-card__trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpenKey((current) => (current === cardKey ? "" : cardKey))}
                >
                  <div className="br-admin-record-card__top">
                    <div>
                      <strong>{row.displayName}</strong>
                      <p>
                        {row.roleContext} · {row.activeRoomCount} активных номеров
                      </p>
                    </div>
                    <AdminBadge tone={getSubscriptionStatusVariant(row.status)}>{row.statusLabel}</AdminBadge>
                  </div>
                  <div className="br-admin-record-card__stats">
                    <div>
                      <span>Доступ до</span>
                      <strong>{row.validUntil ? formatDateLabel(row.validUntil) : "Не задано"}</strong>
                    </div>
                    <div>
                      <span>План</span>
                      <strong>{row.planName}</strong>
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <form action={saveSubscriptionAction} className="br-admin-subscription-form">
                    <input type="hidden" name="profileId" value={row.profileId} />
                    <input type="hidden" name="roleContext" value={row.roleContext} />

                    <AdminAccordion title="Статус и план" defaultOpen>
                      <div className="br-admin-form-grid">
                        <Select
                          id={`${cardKey}-status`}
                          name="status"
                          label="Статус"
                          defaultValue={row.status}
                          options={[
                            { label: "trial", value: "trial" },
                            { label: "active", value: "active" },
                            { label: "grace", value: "grace" },
                            { label: "expired", value: "expired" },
                            { label: "manual", value: "manual" },
                          ]}
                        />
                        <Input
                          id={`${cardKey}-plan`}
                          name="planName"
                          label="План"
                          defaultValue={row.planName}
                        />
                      </div>
                    </AdminAccordion>

                    <AdminAccordion title="Лимиты" subtitle="Ручная корректировка room limit.">
                      <div className="br-admin-form-grid">
                        <Input
                          id={`${cardKey}-limit`}
                          name="activeRoomLimit"
                          label="Лимит активных номеров"
                          defaultValue={row.activeRoomLimit ?? ""}
                          inputMode="numeric"
                        />
                        <Input
                          id={`${cardKey}-rooms`}
                          label="Активные номера"
                          value={String(row.activeRoomCount)}
                          readOnly
                        />
                      </div>
                    </AdminAccordion>

                    <AdminAccordion title="Даты доступа" subtitle="Оплачен до, grace period и текущий доступ.">
                      <div className="br-admin-form-grid">
                        <Input
                          id={`${cardKey}-valid`}
                          label="Доступ до"
                          value={row.validUntil ? formatDateLabel(row.validUntil) : "Не задано"}
                          readOnly
                        />
                        <Input
                          id={`${cardKey}-paid`}
                          name="paidUntil"
                          type="date"
                          label="Оплачено до"
                          defaultValue={row.paidUntil ? new Date(row.paidUntil).toISOString().slice(0, 10) : ""}
                        />
                        <Input
                          id={`${cardKey}-grace`}
                          name="graceEndsAt"
                          type="date"
                          label="Grace period до"
                          defaultValue={row.graceEndsAt ? new Date(row.graceEndsAt).toISOString().slice(0, 10) : ""}
                        />
                      </div>
                    </AdminAccordion>

                    <div className="br-admin-sticky-actions">
                      <Button type="submit" variant="secondary" fullWidth>
                        Сохранить
                      </Button>
                      <Button
                        type="submit"
                        formAction={extendSubscriptionAction}
                        fullWidth
                      >
                        Продлить на 30 дней
                      </Button>
                    </div>
                  </form>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <AdminEmptyState
          title="Подписки не найдены"
          description="Попробуйте другой фильтр или очистите поиск."
        />
      )}
    </section>
  );
}

type PropertyFilter = "all" | "frozen" | "published" | "hidden";

export function AdminPropertiesPage({ data, message }: { data: AdminPropertiesPageData; message: string }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PropertyFilter>("all");

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.properties.filter((row) => {
      if (filter === "frozen" && !row.isFrozen) {
        return false;
      }

      if (filter === "published" && (row.isFrozen || !row.published)) {
        return false;
      }

      if (filter === "hidden" && (row.isFrozen || row.published)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [row.title, row.ownerName, row.slug, row.propertyId].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [data.properties, filter, search]);

  return (
    <section className="br-admin-page">
      <AdminPageHeader
        title="Объекты"
        description="Ручная заморозка и проверка статуса публикации на мобильном экране."
      />

      {message ? (
        <InlineNotice title="Статус действия" aria-live="polite">
          <span>{message}</span>
        </InlineNotice>
      ) : null}

      <section className="br-admin-toolbar br-card">
        <Input
          id="admin-properties-search"
          label="Поиск"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Название, владелец, slug или id"
          wrapperClassName="br-admin-toolbar__search"
        />
        <AdminFilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { label: "Все", value: "all" },
            { label: `Заморожены (${data.frozenPropertyCount})`, value: "frozen" },
            { label: "Опубликованы", value: "published" },
            { label: "Скрыты", value: "hidden" },
          ]}
        />
      </section>

      {filteredProperties.length ? (
        <div className="br-admin-list">
          {filteredProperties.map((row) => (
            <AdminAccordion
              key={row.propertyId}
              title={row.title}
              subtitle={`${row.ownerName} · ${row.activeRoomCount}/${row.totalRoomCount} номеров`}
              rightSlot={<AdminBadge tone={getPropertyStatusVariant(row)}>{getPropertyStatusLabel(row)}</AdminBadge>}
            >
              <div className="br-admin-detail-grid">
                <div>
                  <span>Slug объекта</span>
                  <strong>{row.slug}</strong>
                </div>
                <div>
                  <span>Владелец</span>
                  <strong>{row.ownerName}</strong>
                </div>
              </div>

              {row.ownerPublicSlug ? (
                <Link href={`/p/${row.ownerPublicSlug}`} className="br-admin-external-link" target="_blank">
                  <span>/p/{row.ownerPublicSlug}</span>
                  <ExternalLink aria-hidden="true" />
                </Link>
              ) : (
                <p className="br-admin-muted">Публичная owner-страница ещё не настроена.</p>
              )}

              <div className="br-admin-card-actions">
                <form action={togglePropertyFreezeAction}>
                  <input type="hidden" name="propertyId" value={row.propertyId} />
                  <input type="hidden" name="nextFrozen" value={row.isFrozen ? "false" : "true"} />
                  <Button type="submit" variant="secondary" fullWidth>
                    {row.isFrozen ? "Разморозить объект" : "Заморозить объект"}
                  </Button>
                </form>
              </div>
            </AdminAccordion>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="Ничего не найдено"
          description="Измените фильтр или строку поиска, чтобы увидеть нужные объекты."
        />
      )}
    </section>
  );
}
