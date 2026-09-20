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
import { AppIcon, Button, ButtonLink, InlineNotice, Input, Panel, Select, StatusPill, Textarea } from "@/shared/ui";
import { AdminPageHeader } from "@/widgets/property-admin";

import {
  endSubscriptionAccessAction,
  grantSubscriptionDaysAction,
  recordSubscriptionPaymentAction,
  reviewReferralRewardAction,
  setSubscriptionRoomLimitAction,
  startSubscriptionTrialAction,
  toggleProfilePublicVisibilityAction,
  togglePropertyFreezeAction,
} from "@/features/admin/actions";

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
  return row.inviterProfileId;
}

function getSubscriptionAnchorId(profileId: string) {
  return `subscription-${profileId}`;
}

function getSubscriptionStatusVariant(status: AdminSubscriptionItem["status"]) {
  switch (status) {
    case "active":
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
  const variant = tone === "active" ? "active" : tone === "danger" ? "inactive" : tone === "attention" ? "pending" : "neutral";
  return <StatusPill variant={variant} className="min-h-[30px] px-2.5 text-xs">{children}</StatusPill>;
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
    <section className="rounded-[18px] border border-[var(--border)] bg-[rgb(248_250_252_/_0.9)]">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 rounded-[18px] bg-transparent p-3.5 text-left text-inherit transition hover:bg-[rgb(255_255_255_/_0.52)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="grid gap-1">
          <strong className="block text-sm text-[var(--text)]">{title}</strong>
          {subtitle ? <span className="text-xs leading-[1.45] text-[var(--text-muted)]">{subtitle}</span> : null}
        </div>
        <span className="inline-flex items-center gap-2.5">
          {rightSlot}
          <ChevronDown className={cn("size-[18px] text-[var(--text-muted)] transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
        </span>
      </button>
      {isOpen ? (
        <div id={panelId} className="grid gap-3.5 px-3.5 pb-3.5">
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
    <div className="flex gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Фильтры">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={cn(
            "min-h-9 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--background)] px-3.5 text-[13px] font-bold text-[var(--text-muted)] transition hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]",
            value === option.value && "border-[rgb(var(--color-primary-rgb)_/_0.24)] bg-[rgb(var(--color-primary-rgb)_/_0.08)] text-[var(--color-primary-hover)]",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
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
    <Panel as="article" className="grid gap-2 rounded-[22px] bg-[rgb(255_255_255_/_0.95)] p-4 max-[390px]:rounded-[18px] max-[390px]:p-3">
      <span className="min-w-0 text-sm text-[var(--text-muted)]">{label}</span>
      <strong className="text-3xl leading-none text-[var(--text)] max-[390px]:text-[26px]">{value}</strong>
      <small className="min-w-0 text-xs leading-[1.45] text-[var(--text-muted)]">{hint}</small>
    </Panel>
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
    <Panel as="article" className="grid gap-3.5 rounded-[22px] bg-[rgb(255_255_255_/_0.95)] p-4 max-[390px]:rounded-[18px] max-[390px]:p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block text-[var(--text)]">{title}</strong>
          <p className="min-w-0 text-sm leading-[1.5] text-[var(--text-muted)]">{description}</p>
        </div>
        <AdminBadge tone={count > 0 ? "attention" : "neutral"}>{count}</AdminBadge>
      </div>
      <div>{children}</div>
      <Link href={href} className="inline-flex items-center gap-2 font-bold text-[var(--color-primary-hover)] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]">
        Открыть раздел
        <ArrowRight aria-hidden="true" />
      </Link>
    </Panel>
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
    <Panel as="article" className="grid justify-items-start gap-2.5 rounded-[22px] bg-[rgb(255_255_255_/_0.95)] p-4 max-[390px]:rounded-[18px] max-[390px]:p-3">
      <div className="grid size-12 place-items-center rounded-2xl bg-[rgb(var(--color-primary-rgb)_/_0.08)] text-[var(--color-primary-hover)]" aria-hidden="true">
        <AppIcon icon={Shield} />
      </div>
      <strong>{title}</strong>
      <p className="text-sm leading-[1.5] text-[var(--text-muted)]">{description}</p>
    </Panel>
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
    return <p className="text-sm text-[var(--text-muted)]">Сейчас здесь пусто.</p>;
  }

  return (
    <div className="grid gap-2.5">
      {items.map((item) => (
        <article key={`${item.title}-${item.subtitle}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[rgb(243_248_247_/_0.68)] px-3.5 py-3">
          <div className="min-w-0">
            <strong className="block text-sm text-[var(--text)]">{item.title}</strong>
            <span className="min-w-0 text-xs leading-[1.45] text-[var(--text-muted)]">{item.subtitle}</span>
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
    { label: "Владельцы", value: String(data.ownerCount), hint: "Кабинеты владельцев" },
    { label: "Агенты", value: String(data.agentCount), hint: "Профили с ролью агента" },
    { label: "Две роли", value: String(data.dualRoleCount), hint: "Владелец и агент в одном профиле" },
  ];

  const subscriptionStats = [
    { label: "Активные подписки", value: String(data.activeSubscriptionCount), hint: "Текущий статус active" },
    { label: "Платящие сейчас", value: String(data.paidUserCount), hint: "Уникальные профили с доступом" },
    { label: "Скоро истекают", value: String(data.expiringSoonCount), hint: "Нужна ручная проверка" },
    { label: "Реферальная очередь", value: String(data.pendingReferralCount), hint: "Ожидают решения администратора" },
  ];

  const activityStats = [
    { label: "Объекты", value: String(data.propertyCount), hint: "Все созданные объекты" },
    { label: "Номера", value: String(data.roomCount), hint: "Опубликованные и архивные варианты" },
    { label: "Заявки", value: String(data.requestCount), hint: "Всего запросов на проживание" },
    { label: "Коллекции", value: String(data.collectionCount), hint: "Подборки владельцев и агентов" },
  ];

  return (
    <section className="grid gap-[14px] rounded-[24px] border border-[var(--border)] bg-[rgb(255_255_255_/_0.95)] p-[18px] shadow-[var(--shadow-md)] max-[720px]:rounded-[22px] max-[720px]:p-3.5 max-[390px]:gap-2.5 max-[390px]:rounded-[20px] max-[390px]:p-3">
      <AdminPageHeader
        variant="plain"
        title="Админка Bronly"
        description="Мобильная сводка по пользователям, подпискам и внутренним проверкам."
        actions={
          <>
            <ButtonLink href="/admin/reviews">
              Проверки
            </ButtonLink>
            <ButtonLink href="/admin/subscriptions" variant="secondary">
              Подписки
            </ButtonLink>
          </>
        }
      />

      {message ? (
        <InlineNotice title="Статус действия" aria-live="polite">
          <span>{message}</span>
        </InlineNotice>
      ) : null}

      <section className="grid gap-3.5">
        <div className="grid gap-1.5">
          <h2 className="text-[clamp(24px,4vw,36px)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--text)]">Пользователи</h2>
          <p className="text-sm text-[var(--text-muted)]">Кого сейчас обслуживает платформа.</p>
        </div>
        <div className="grid grid-cols-4 gap-3.5 max-[1080px]:grid-cols-2 max-[720px]:grid-cols-1 max-[390px]:gap-2.5">
          {peopleStats.map((item) => (
            <AdminSummaryCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="grid gap-3.5">
        <div className="grid gap-1.5">
          <h2 className="text-[clamp(24px,4vw,36px)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--text)]">Подписки</h2>
          <p className="text-sm text-[var(--text-muted)]">Что требует ручного продления и внимания.</p>
        </div>
        <div className="grid grid-cols-4 gap-3.5 max-[1080px]:grid-cols-2 max-[720px]:grid-cols-1 max-[390px]:gap-2.5">
          {subscriptionStats.map((item) => (
            <AdminSummaryCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="grid gap-3.5">
        <div className="grid gap-1.5">
          <h2 className="text-[clamp(24px,4vw,36px)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--text)]">Активность</h2>
          <p className="text-sm text-[var(--text-muted)]">Объекты, номера и поток заявок.</p>
        </div>
        <div className="grid grid-cols-4 gap-3.5 max-[1080px]:grid-cols-2 max-[720px]:grid-cols-1 max-[390px]:gap-2.5">
          {activityStats.map((item) => (
            <AdminSummaryCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1 max-[390px]:gap-2.5">
        <AdminPreviewCard
          title="Очередь проверок"
          description="Реферальные продления, которые нужно подтвердить или отклонить."
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
              title: `${item.displayName} · ${getSubscriptionRolesLabel(item.roles)}`,
              subtitle: item.validUntil ? `Доступ до ${formatDateLabel(item.validUntil)}` : "Дата не указана",
              badge: { label: item.statusLabel, tone: getSubscriptionStatusVariant(item.status) },
            }))}
          />
        </AdminPreviewCard>

        <AdminPreviewCard
          title="Скрытые страницы"
          description="Профили владельцев и агентов, скрытые администратором."
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
    <section className="grid gap-[14px] rounded-[24px] border border-[var(--border)] bg-[rgb(255_255_255_/_0.95)] p-[18px] shadow-[var(--shadow-md)] max-[720px]:rounded-[22px] max-[720px]:p-3.5 max-[390px]:gap-2.5 max-[390px]:rounded-[20px] max-[390px]:p-3">
      <AdminPageHeader
        variant="plain"
        title="Проверки"
        description="Решения по реферальным продлениям и быстрый переход к нужной подписке."
      />

      <InlineNotice tone="soft" title="Как применяется бонус">
        Подтверждение один раз продлит на 10 дней все контексты владельца и агента у пригласившего. Отклонение не меняет подписки.
      </InlineNotice>

      {message ? (
        <InlineNotice title="Статус действия" aria-live="polite">
          <span>{message}</span>
        </InlineNotice>
      ) : null}

      {data.pendingReferralRewards.length ? (
        <div className="grid gap-3.5 max-[390px]:gap-2.5">
          {data.pendingReferralRewards.map((row) => (
            <Panel key={row.rewardId} as="article" className="grid gap-3.5 rounded-[22px] bg-[rgb(255_255_255_/_0.95)] p-4 max-[390px]:rounded-[18px] max-[390px]:p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="block text-[var(--text)]">{row.inviterName}</strong>
                  <p className="text-sm text-[var(--text-muted)]">Приглашён: {row.invitedName}</p>
                </div>
                <AdminBadge tone="attention">+{row.rewardDays} дней</AdminBadge>
              </div>

              <div className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1 max-[390px]:gap-2.5">
                <div className="grid gap-1">
                  <span className="text-xs text-[var(--text-muted)]">Целевое действие</span>
                  <strong className="block text-sm text-[var(--text)]">{row.milestoneLabel}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[var(--text-muted)]">Когда достигнуто</span>
                  <strong className="block text-sm text-[var(--text)]">{row.milestoneReachedAt}</strong>
                </div>
              </div>

              <AdminAccordion
                title="Подробнее"
                subtitle="Показать роли, профиль и быстрый переход к подписке."
              >
                <div className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1 max-[390px]:gap-2.5">
                  <div className="grid gap-1">
                    <span className="text-xs text-[var(--text-muted)]">Контексты продления</span>
                    <strong className="block text-sm text-[var(--text)]">{row.inviterRoles.join(", ") || "Нет доступных контекстов"}</strong>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs text-[var(--text-muted)]">Профиль пригласившего</span>
                    <strong className="block text-sm text-[var(--text)]">id {getShortProfileId(row.inviterProfileId)}</strong>
                  </div>
                </div>
                <Link
                  href={`/admin/subscriptions?focus=${encodeURIComponent(getSubscriptionFocusKey(row))}`}
                  className="inline-flex items-center gap-2 font-bold text-[var(--color-primary-hover)] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]"
                >
                  Перейти к подписке
                  <ArrowRight aria-hidden="true" />
                </Link>
              </AdminAccordion>

              <div className="grid gap-2.5 max-[720px]:sticky max-[720px]:bottom-[calc(74px+var(--safe-area-bottom))] max-[720px]:rounded-[18px] max-[720px]:border max-[720px]:border-[var(--border)] max-[720px]:bg-[rgb(255_255_255_/_0.96)] max-[720px]:p-2.5 max-[720px]:shadow-[var(--shadow-md)] sm:grid-cols-2">
                <form action={reviewReferralRewardAction}>
                  <input type="hidden" name="rewardId" value={row.rewardId} />
                  <input type="hidden" name="decision" value="approved" />
                  <Button type="submit" fullWidth>
                    Подтвердить +10 дней
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
            </Panel>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="Очередь проверок пуста"
          description="Новых реферальных продлений для ручного подтверждения пока нет."
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
    <section className="grid gap-[14px] rounded-[24px] border border-[var(--border)] bg-[rgb(255_255_255_/_0.95)] p-[18px] shadow-[var(--shadow-md)] max-[720px]:rounded-[22px] max-[720px]:p-3.5 max-[390px]:gap-2.5 max-[390px]:rounded-[20px] max-[390px]:p-3">
      <AdminPageHeader
        variant="plain"
        title="Пользователи"
        description="Роли, контакты, публичные ссылки и ручное скрытие страниц."
      />

      {message ? (
        <InlineNotice title="Статус действия" aria-live="polite">
          <span>{message}</span>
        </InlineNotice>
      ) : null}

      <Panel className="grid gap-3.5 rounded-[22px] bg-[rgb(255_255_255_/_0.95)] p-4 max-[390px]:rounded-[18px] max-[390px]:p-3">
        <Input
          id="admin-users-search"
          label="Поиск"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Имя, slug, телефон или id"
          wrapperClassName="max-w-[460px]"
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
      </Panel>

      {filteredUsers.length ? (
        <div className="grid gap-3.5 max-[390px]:gap-2.5">
          {filteredUsers.map((row) => (
            <AdminAccordion
              key={row.profileId}
              title={row.displayName}
              subtitle={`${row.roles.join(", ") || "owner"} · ${row.requestCount} заявок`}
              rightSlot={<AdminBadge tone={getUserVisibilityVariant(row)}>{getUserVisibilityLabel(row)}</AdminBadge>}
            >
              <div className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1 max-[390px]:gap-2.5">
                <div className="grid gap-1">
                  <span className="text-xs text-[var(--text-muted)]">Профиль</span>
                  <strong className="block text-sm text-[var(--text)]">id {getShortProfileId(row.profileId)}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[var(--text-muted)]">Создан</span>
                  <strong className="block text-sm text-[var(--text)]">{row.createdAt ? formatDateTimeLabel(row.createdAt) : "Не задано"}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[var(--text-muted)]">Контакт</span>
                  <strong className="block text-sm text-[var(--text)]">{row.phone || "Не указан"}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[var(--text-muted)]">Объекты</span>
                  <strong className="block text-sm text-[var(--text)]">{row.propertyCount}</strong>
                </div>
              </div>

              <div className="grid gap-3.5">
                {row.publicPageUrls.length ? (
                  row.publicPageUrls.map((link) => (
                    <Link key={link} href={link} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[rgb(243_248_247_/_0.68)] px-3.5 py-3 font-bold text-[var(--color-primary-hover)] hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]" target="_blank" rel="noreferrer">
                      <span>{link}</span>
                      <ExternalLink aria-hidden="true" />
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">Публичные ссылки ещё не созданы.</p>
                )}
              </div>

              {row.publicPageUrls.length ? (
                <div className="grid gap-2.5">
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

function getSubscriptionRolesLabel(roles: AdminSubscriptionItem["roles"]) {
  if (roles.includes("owner") && roles.includes("agent")) {
    return "Владелец и агент";
  }

  return roles.includes("owner") ? "Владелец" : "Агент";
}

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
      if (contextFilter !== "all" && !row.roles.includes(contextFilter)) {
        return false;
      }

      if (statusFilter === "expiring" && !isExpiringSoon(row.validUntil)) {
        return false;
      }

      if (statusFilter === "grace" && row.status !== "grace") {
        return false;
      }

      if (statusFilter === "active" && row.status !== "active") {
        return false;
      }

      if (statusFilter === "expired" && row.status !== "expired") {
        return false;
      }

      if (!query) {
        return true;
      }

      return [row.displayName, row.slug, row.profileId, ...row.roles].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [contextFilter, data.subscriptions, search, statusFilter]);

  return (
    <section className="grid gap-[14px] rounded-[24px] border border-[var(--border)] bg-[rgb(255_255_255_/_0.95)] p-[18px] shadow-[var(--shadow-md)] max-[720px]:rounded-[22px] max-[720px]:p-3.5 max-[390px]:gap-2.5 max-[390px]:rounded-[20px] max-[390px]:p-3">
      <AdminPageHeader
        variant="plain"
        title="Подписки"
        description="Управляйте единым тарифом Bronly, статусами и индивидуальными лимитами свыше 15 номеров. Каждое продление записывается в журнал."
      />

      {message ? (
        <InlineNotice title="Статус действия" aria-live="polite">
          <span>{message}</span>
        </InlineNotice>
      ) : null}

      <Panel className="grid gap-3.5 rounded-[22px] bg-[rgb(255_255_255_/_0.95)] p-4 max-[390px]:rounded-[18px] max-[390px]:p-3">
        <Input
          id="admin-subscriptions-search"
          label="Поиск"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Имя, slug или ID профиля"
          wrapperClassName="max-w-[460px]"
        />
        <AdminFilterChips
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Все", value: "all" },
            { label: `Скоро истекают (${data.expiringSoonCount})`, value: "expiring" },
            { label: "Нужно продлить", value: "grace" },
            { label: `Активные (${data.activeSubscriptionCount})`, value: "active" },
            { label: "Доступ завершён", value: "expired" },
          ]}
        />
        <AdminFilterChips
          value={contextFilter}
          onChange={setContextFilter}
          options={[
            { label: "Все роли", value: "all" },
            { label: "Владельцы", value: "owner" },
            { label: "Агенты", value: "agent" },
          ]}
        />
      </Panel>

      {filteredSubscriptions.length ? (
        <div className="grid gap-3.5 max-[390px]:gap-2.5">
          {filteredSubscriptions.map((row) => {
            const cardKey = row.profileId;
            const isOpen = openKey === cardKey;

            return (
              <article
                key={cardKey}
                id={getSubscriptionAnchorId(row.profileId)}
                ref={focusKey === cardKey ? focusedCardRef : undefined}
                className={cn(
                  "grid gap-3.5 rounded-[22px] border border-[var(--border)] bg-[rgb(255_255_255_/_0.95)] p-4 max-[390px]:rounded-[18px] max-[390px]:p-3",
                  isOpen && "shadow-[0_0_0_1px_rgb(var(--color-primary-rgb)_/_0.22),0_18px_36px_rgb(var(--color-primary-rgb)_/_0.10)]",
                )}
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 bg-transparent p-0 text-left text-inherit focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]"
                  aria-expanded={isOpen}
                  onClick={() => setOpenKey((current) => (current === cardKey ? "" : cardKey))}
                >
                  <div className="grid min-w-0 flex-1 gap-3.5">
                    <div>
                      <strong className="block text-[var(--text)]">{row.displayName}</strong>
                      <p className="text-sm text-[var(--text-muted)]">
                        {getSubscriptionRolesLabel(row.roles)} · {row.activeRoomCount} из {row.roomLimit} активных номеров
                      </p>
                    </div>
                    <AdminBadge tone={getSubscriptionStatusVariant(row.status)}>{row.statusLabel}</AdminBadge>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1 max-[390px]:gap-2.5">
                    <div className="grid gap-1">
                      <span className="text-xs text-[var(--text-muted)]">Доступ до</span>
                      <strong className="block text-sm text-[var(--text)]">{row.validUntil ? formatDateLabel(row.validUntil) : "Не задано"}</strong>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-xs text-[var(--text-muted)]">План</span>
                      <strong className="block text-sm text-[var(--text)]">Bronly</strong>
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-3 gap-3.5 max-[720px]:grid-cols-1">
                      <Input id={`${cardKey}-valid`} label="Доступ до" value={row.validUntil ? formatDateLabel(row.validUntil) : "Не задано"} readOnly />
                      <Input id={`${cardKey}-paid`} label="Оплачено до" value={row.paidUntil ? formatDateLabel(row.paidUntil) : "Нет оплаты"} readOnly />
                      <Input id={`${cardKey}-grace`} label="Льготный период до" value={row.graceEndsAt ? formatDateLabel(row.graceEndsAt) : "Не активен"} readOnly />
                    </div>

                    {!row.hasSubscriptionRow ? (
                      <form action={startSubscriptionTrialAction} className="grid gap-3 rounded-[18px] border border-[var(--border)] p-3.5">
                        <input type="hidden" name="profileId" value={row.profileId} />
                        <div>
                          <strong className="block text-sm text-[var(--text)]">Подписка ещё не создана</strong>
                          <p className="mt-1 text-sm text-[var(--text-muted)]">Запустите один пробный период на 30 дней для всех ролей пользователя.</p>
                        </div>
                        <Button type="submit">Начать пробный период</Button>
                      </form>
                    ) : (
                      <>
                        <AdminAccordion title="Зарегистрировать оплату" subtitle="Цена и срок подставляются автоматически. Уже оплаченный остаток не сгорает." defaultOpen>
                          <form action={recordSubscriptionPaymentAction} className="grid gap-3.5">
                            <input type="hidden" name="profileId" value={row.profileId} />
                            <div className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1">
                              <Select id={`${cardKey}-period`} name="billingPeriod" label="Период и сумма" defaultValue="month" options={[{ label: "30 дней — 490 ₽", value: "month" }, { label: "365 дней — 4 490 ₽", value: "year" }]} />
                              <Select id={`${cardKey}-method`} name="paymentMethod" label="Способ оплаты" defaultValue="bank_transfer" options={[{ label: "Банковский перевод", value: "bank_transfer" }, { label: "Наличные", value: "cash" }, { label: "Другое", value: "other" }]} />
                              <Input id={`${cardKey}-paid-at`} name="paidAt" type="date" label="Дата оплаты (пусто — сегодня)" />
                              <Input id={`${cardKey}-reference`} name="externalReference" label="Номер операции" placeholder="Необязательно" />
                            </div>
                            <Textarea id={`${cardKey}-payment-note`} name="note" label="Комментарий" placeholder="Необязательно" rows={2} />
                            <Button type="submit">Зарегистрировать оплату</Button>
                          </form>
                        </AdminAccordion>

                        <AdminAccordion title="Добавить бесплатные дни" subtitle="Для компенсации, реферального бонуса или другого согласованного случая. Оплата не создаётся.">
                          <form action={grantSubscriptionDaysAction} className="grid gap-3.5">
                            <input type="hidden" name="profileId" value={row.profileId} />
                            <Input id={`${cardKey}-days`} name="extensionDays" label="Количество дней" inputMode="numeric" placeholder="Например, 10" required />
                            <Textarea id={`${cardKey}-extension-reason`} name="reason" label="Причина" placeholder="Почему добавлены бесплатные дни" rows={2} required />
                            <Button type="submit" variant="secondary">Добавить дни</Button>
                          </form>
                        </AdminAccordion>

                        <AdminAccordion title="Изменить лимит номеров" subtitle={`Сейчас используется ${row.activeRoomCount} из ${row.roomLimit}. Пустое значение возвращает стандартный лимит 15.`}>
                          <form action={setSubscriptionRoomLimitAction} className="grid gap-3.5">
                            <input type="hidden" name="profileId" value={row.profileId} />
                            <Input id={`${cardKey}-limit`} name="roomLimitOverride" label="Индивидуальный лимит" defaultValue={row.roomLimitOverride ?? ""} inputMode="numeric" placeholder="Стандартный лимит — 15" />
                            <Textarea id={`${cardKey}-limit-reason`} name="reason" label="Причина изменения" rows={2} required />
                            <Button type="submit" variant="secondary">Сохранить лимит</Button>
                          </form>
                        </AdminAccordion>

                        <AdminAccordion title="Завершить доступ" subtitle="Публичные страницы и новые заявки будут отключены. Данные пользователя сохранятся.">
                          <form action={endSubscriptionAccessAction} className="grid gap-3.5">
                            <input type="hidden" name="profileId" value={row.profileId} />
                            <Textarea id={`${cardKey}-end-reason`} name="reason" label="Причина завершения" rows={2} required />
                            <Button type="submit" variant="danger">Завершить доступ</Button>
                          </form>
                        </AdminAccordion>
                      </>
                    )}

                    <ButtonLink href={`/admin/subscriptions/${row.profileId}`} variant="ghost">Открыть платежи и историю</ButtonLink>
                  </div>
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
    <section className="grid gap-[14px] rounded-[24px] border border-[var(--border)] bg-[rgb(255_255_255_/_0.95)] p-[18px] shadow-[var(--shadow-md)] max-[720px]:rounded-[22px] max-[720px]:p-3.5 max-[390px]:gap-2.5 max-[390px]:rounded-[20px] max-[390px]:p-3">
      <AdminPageHeader
        variant="plain"
        title="Объекты"
        description="Ручная заморозка и проверка статуса публикации на мобильном экране."
      />

      {message ? (
        <InlineNotice title="Статус действия" aria-live="polite">
          <span>{message}</span>
        </InlineNotice>
      ) : null}

      <Panel className="grid gap-3.5 rounded-[22px] bg-[rgb(255_255_255_/_0.95)] p-4 max-[390px]:rounded-[18px] max-[390px]:p-3">
        <Input
          id="admin-properties-search"
          label="Поиск"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Название, владелец, slug или id"
          wrapperClassName="max-w-[460px]"
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
      </Panel>

      {filteredProperties.length ? (
        <div className="grid gap-3.5 max-[390px]:gap-2.5">
          {filteredProperties.map((row) => (
            <AdminAccordion
              key={row.propertyId}
              title={row.title}
              subtitle={`${row.ownerName} · ${row.activeRoomCount}/${row.totalRoomCount} номеров`}
              rightSlot={<AdminBadge tone={getPropertyStatusVariant(row)}>{getPropertyStatusLabel(row)}</AdminBadge>}
            >
              <div className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1 max-[390px]:gap-2.5">
                <div className="grid gap-1">
                  <span className="text-xs text-[var(--text-muted)]">Slug объекта</span>
                  <strong className="block text-sm text-[var(--text)]">{row.slug}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[var(--text-muted)]">Владелец</span>
                  <strong className="block text-sm text-[var(--text)]">{row.ownerName}</strong>
                </div>
              </div>

              {row.ownerPublicSlug ? (
                <Link href={`/p/${row.ownerPublicSlug}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[rgb(243_248_247_/_0.68)] px-3.5 py-3 font-bold text-[var(--color-primary-hover)] hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]" target="_blank" rel="noreferrer">
                  <span>/p/{row.ownerPublicSlug}</span>
                  <ExternalLink aria-hidden="true" />
                </Link>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">Публичная страница владельца ещё не настроена.</p>
              )}

              <div className="grid gap-2.5">
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
