import { CalendarDays, ExternalLink, HousePlus, Inbox, Plus } from "lucide-react";
import Link from "next/link";

import type { OwnerDashboardSummary } from "@/entities/property";
import { AppIcon, ButtonLink, type AppIconComponent } from "@/shared/ui";
import { OwnerDashboardOnboarding } from "./owner-dashboard-onboarding";

const quickActions = [
  {
    icon: Plus,
    title: "Добавить номер",
    text: "Создайте новый номер или перейдите к объекту, чтобы подготовить витрину к новым заявкам.",
  },
  {
    icon: CalendarDays,
    title: "Календарь занятости",
    text: "Отмечайте занятые даты и периоды недоступности вручную по каждому номеру.",
  },
  {
    icon: Inbox,
    title: "Заявки",
    text: "Просматривайте новые запросы на проживание и связывайтесь с гостями напрямую.",
  },
  {
    icon: ExternalLink,
    title: "Публичная страница",
    text: "Проверьте, как гость видит вашу витрину по персональной ссылке владельца.",
  },
] satisfies Array<{ icon: AppIconComponent; title: string; text: string }>;

const emptyStates = [
  {
    id: "no-properties",
    icon: HousePlus,
    title: "Нет объектов",
    text: "Добавьте первый объект, чтобы перейти к номерам, ценам и календарю занятости.",
    action: "Добавить объект",
    href: "/dashboard/properties/new",
  },
  {
    id: "no-rooms",
    icon: Plus,
    title: "Нет номеров",
    text: "В объектах пока нет номеров. Добавьте первый номер, чтобы гости могли оставить заявку.",
    action: "Открыть объекты",
    href: "/dashboard/properties",
  },
] satisfies Array<{
  id: "no-properties" | "no-rooms";
  icon: AppIconComponent;
  title: string;
  text: string;
  action: string;
  href: string;
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
          value: dashboardStats.publicUrl ?? "Заполните slug владельца в настройках",
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
      {dashboardStats.isCabinetRestricted ? (
        <section className="br-dashboard-block br-card">
          <div className="br-dashboard-block__header">
            <div>
              <h2>Продление доступа</h2>
              <p>
                Публичные страницы и новые заявки временно недоступны. Доступ восстановится после ручного
                продления подписки.
              </p>
            </div>
          </div>
          <div className="br-summary-card__rows">
            <div className="br-summary-card__row">
              <span>Как продлить</span>
              <strong>Свяжитесь с администратором и подтвердите оплату</strong>
            </div>
          </div>
          <div className="br-owner-actions">
            <ButtonLink href="/dashboard/subscription" variant="secondary">
              Открыть подписку
            </ButtonLink>
          </div>
        </section>
      ) : null}

      {dashboardStats.subscriptionWarningText ? (
        <div className="br-inline-notice">{dashboardStats.subscriptionWarningText}</div>
      ) : null}

      <section className="br-summary-grid">
        {summaryCards.map((card) => (
          <article key={card.title} className="br-summary-card br-card">
            <div className="br-summary-card__header">
              <strong>{card.title}</strong>
              {card.badge ? <span className="br-summary-card__badge">{card.badge}</span> : null}
            </div>
            <div className="br-summary-card__rows">
              {card.rows.map((row) => (
                <div key={row.label} className="br-summary-card__row">
                  <span>{row.label}</span>
                  {row.href ? (
                    <Link href={row.href}>
                      <strong>{row.value}</strong>
                    </Link>
                  ) : (
                    <strong>{row.value}</strong>
                  )}
                </div>
              ))}
            </div>
            <ButtonLink href={card.href} fullWidth>
              {card.action}
            </ButtonLink>
          </article>
        ))}
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Быстрые действия</h2>
            <p>Собрали частые сценарии владельца в одном месте, чтобы быстрее переходить к работе.</p>
          </div>
        </div>
        <div className="br-quick-grid">
          {quickActions.map((action) => (
            <article key={action.title} className="br-quick-card">
              <div className="br-quick-card__icon" aria-hidden="true">
                <AppIcon icon={action.icon} />
              </div>
              <strong>{action.title}</strong>
              <p>{action.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Пригласить агента</h2>
            <p>Отправьте персональную ссылку. Если агент зарегистрируется по ней и дойдет до первого активного сотрудничества, администратор сможет вручную продлить вашу подписку на 10 дней.</p>
          </div>
        </div>
        <div className="br-owner-actions">
          <ButtonLink href="/dashboard/referrals">Открыть приглашение</ButtonLink>
        </div>
      </section>

      <OwnerDashboardOnboarding onboarding={dashboardStats.onboarding} emptyStates={emptyStatesToShow} />
    </>
  );
}
