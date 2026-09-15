import { CalendarDays, ExternalLink, Inbox, Plus } from "lucide-react";
import Link from "next/link";

import type { OwnerDashboardSummary } from "@/entities/property";
import { AppIcon, ButtonLink, InlineNotice, Panel, type AppIconComponent } from "@/shared/ui";

import { OwnerDashboardActionSection } from "./owner-dashboard-action-section";
import { OwnerDashboardOnboarding } from "./owner-dashboard-onboarding";

const quickActions = [
  {
    icon: Plus,
    title: "Добавить номер",
    text: "Создайте новый номер или перейдите к объекту, чтобы подготовить витрину к новым заявкам.",
    href: "/dashboard/rooms/new",
  },
  {
    icon: CalendarDays,
    title: "Календарь занятости",
    text: "Отмечайте занятые даты и периоды недоступности вручную по каждому номеру.",
    href: "/dashboard/calendar",
  },
  {
    icon: Inbox,
    title: "Заявки",
    text: "Просматривайте новые запросы на проживание и связывайтесь с гостями напрямую.",
    href: "/dashboard/requests",
  },
  {
    icon: ExternalLink,
    title: "Публичная страница",
    text: "Проверьте, как гость видит вашу витрину по персональной ссылке владельца.",
    href: "/dashboard/settings",
  },
] satisfies Array<{ icon: AppIconComponent; title: string; text: string; href: string }>;

const emptyStates = [
  {
    id: "no-properties",
    iconId: "house-plus",
    title: "Нет объектов",
    text: "Добавьте первый объект, чтобы перейти к номерам, ценам и календарю занятости.",
    action: "Добавить объект",
    href: "/dashboard/properties/new",
    secondaryAction: "Создать отдельный номер",
    secondaryHref: "/dashboard/rooms/new",
  },
  {
    id: "no-rooms",
    iconId: "plus",
    title: "Нет номеров",
    text: "В объектах пока нет номеров. Добавьте первый номер, чтобы гости могли оставить заявку.",
    action: "Открыть объекты",
    href: "/dashboard/properties",
  },
] satisfies Array<{
  id: "no-properties" | "no-rooms";
  iconId: "house-plus" | "plus";
  title: string;
  text: string;
  action: string;
  href: string;
  secondaryAction?: string;
  secondaryHref?: string;
}>;

type OwnerDashboardOverviewProps = {
  dashboardStats: OwnerDashboardSummary;
};

type SummaryCardRow = {
  label: string;
  value: string;
  href?: string;
};

type SummaryCard = {
  title: string;
  badge?: string;
  rows: SummaryCardRow[];
  href: string;
  action: string;
};

export function OwnerDashboardOverview({ dashboardStats }: OwnerDashboardOverviewProps) {
  if (dashboardStats.loadState === "unavailable") {
    return (
      <InlineNotice title="Не удалось загрузить данные кабинета" tone="warning" aria-live="polite">
        Статистика и действия временно недоступны. Обновите страницу позже; демонстрационные данные не подставлялись.
      </InlineNotice>
    );
  }

  const hasPublicUrl = Boolean(dashboardStats.publicUrl);
  const emptyStatesToShow = emptyStates.filter((state) => {
    if (state.id === "no-properties") {
      return dashboardStats.objects === 0;
    }

    if (state.id === "no-rooms") {
      return dashboardStats.objects > 0 && dashboardStats.rooms === 0;
    }

    return false;
  });

  const summaryCards: SummaryCard[] = [
    {
      title: "Подписка",
      badge: dashboardStats.subscriptionPlan,
      rows: [
        { label: "Статус", value: dashboardStats.subscriptionStatusLabel },
        { label: "Действует до", value: dashboardStats.subscriptionValidUntil },
      ],
      href: "/dashboard/subscription",
      action: "Открыть подписку",
    },
    {
      title: "Публичная ссылка",
      rows: [
        {
          label: "Адрес",
          value: hasPublicUrl ? "Публичная страница владельца" : "Заполните slug владельца в настройках",
          href: dashboardStats.publicUrl ?? undefined,
        },
        {
          label: "Доступ",
          value: dashboardStats.isCabinetRestricted ? "Временно ограничен" : "Открыта для гостей",
        },
      ],
      href: hasPublicUrl ? (dashboardStats.publicUrl as string) : "/dashboard/settings",
      action: hasPublicUrl ? "Открыть публичную страницу" : "Заполнить slug",
    },
    {
      title: "Общая статистика",
      rows: [
        { label: "Объекты", value: String(dashboardStats.objects) },
        { label: "Номера", value: String(dashboardStats.rooms) },
        { label: "Новые заявки", value: String(dashboardStats.newRequests) },
      ],
      href: "/dashboard/requests",
      action: "Посмотреть заявки",
    },
  ];

  return (
    <>
      {dashboardStats.loadState === "demo" ? (
        <InlineNotice title="Демонстрационный режим" tone="soft">
          На странице показаны тестовые данные. Действия, требующие сохранения, недоступны без Supabase.
        </InlineNotice>
      ) : null}

      {dashboardStats.isCabinetRestricted ? (
        <OwnerDashboardActionSection
          title="Продление доступа"
          description="Публичные страницы и новые заявки временно недоступны. Доступ восстановится после ручного продления подписки."
          href="/dashboard/subscription"
          actionLabel="Открыть подписку"
          buttonVariant="secondary"
        >
          <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
            <div className="grid gap-1.5 px-4 py-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
              <span className="text-sm text-[var(--text-muted)]">Как продлить</span>
              <strong className="text-sm text-[var(--text)]">Свяжитесь с администратором и подтвердите оплату</strong>
            </div>
          </div>
        </OwnerDashboardActionSection>
      ) : null}

      {dashboardStats.subscriptionWarningText ? <InlineNotice tone="warning">{dashboardStats.subscriptionWarningText}</InlineNotice> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <Panel key={card.title} as="article" className="grid content-between gap-4 p-5" surface="raised">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-lg text-[var(--text)]">{card.title}</strong>
              {card.badge ? <span className="inline-flex min-h-7 items-center rounded-full bg-[var(--color-primary-pale)] px-3 text-xs font-bold text-[var(--color-primary-hover)]">{card.badge}</span> : null}
            </div>
            <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
              {card.rows.map((row) => (
                <div key={row.label} className="grid gap-1.5 border-b border-[var(--border)] px-3.5 py-3 last:border-b-0 sm:grid-cols-[100px_minmax(0,1fr)] sm:items-center">
                  <span className="text-xs text-[var(--text-muted)]">{row.label}</span>
                  {row.href ? (
                    <Link href={row.href} className="text-sm text-[var(--color-primary-hover)] underline-offset-4 hover:underline">
                      <strong>{row.value}</strong>
                    </Link>
                  ) : (
                    <strong className="text-sm text-[var(--text)]">{row.value}</strong>
                  )}
                </div>
              ))}
            </div>
            <ButtonLink href={card.href} fullWidth>
              {card.action}
            </ButtonLink>
          </Panel>
        ))}
      </section>

      <Panel className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
        <div className="grid gap-1.5">
          <h2 className="text-xl font-semibold leading-[1.15] text-[var(--text)]">Быстрые действия</h2>
          <p className="text-sm leading-[1.55] text-[var(--text-muted)]">Собрали частые сценарии владельца в одном месте, чтобы быстрее переходить к работе.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href} className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-inherit transition-[border-color,background-color,transform] duration-[180ms] hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]">
              <div className="grid size-10 place-items-center rounded-[14px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-[var(--color-primary-hover)]" aria-hidden="true">
                <AppIcon icon={action.icon} />
              </div>
              <strong className="text-base text-[var(--text)]">{action.title}</strong>
              <p className="text-sm leading-[1.5] text-[var(--text-muted)]">{action.text}</p>
            </Link>
          ))}
        </div>
      </Panel>

      <OwnerDashboardActionSection
        title="Приглашения"
        description="Подготовьте персональную ссылку для владельца или агента. Роль выбирается на следующем экране."
        href="/dashboard/referrals"
        actionLabel="Пригласить"
        buttonSize="sm"
        actionPlacement="header"
      />

      <OwnerDashboardOnboarding onboarding={dashboardStats.onboarding} emptyStates={emptyStatesToShow} />
    </>
  );
}
