import { ArrowRight, Building2, CalendarDays, ChevronRight, ExternalLink, Layers3, UserPlus } from "lucide-react";
import Link from "next/link";

import type { OwnerDashboardSummary } from "@/entities/property";
import { AppIcon, ButtonLink, InlineNotice, Panel, type AppIconComponent } from "@/shared/ui";

import { OwnerDashboardActionSection } from "./owner-dashboard-action-section";
import { OwnerDashboardOnboarding } from "./owner-dashboard-onboarding";

const quickActions = [
  {
    icon: CalendarDays,
    title: "Календарь занятости",
    text: "Свободные и занятые даты",
    href: "/dashboard/calendar",
  },
  {
    icon: Building2,
    title: "Объекты и номера",
    text: "Фотографии, цены и условия",
    href: "/dashboard/properties",
  },
  {
    icon: Layers3,
    title: "Коллекции",
    text: "Подборки для ваших гостей",
    href: "/dashboard/collections",
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

  const publicPageHref = hasPublicUrl ? (dashboardStats.publicUrl as string) : "/dashboard/settings";
  const publicStatusLabel = dashboardStats.isPublicRestricted
    ? "Временно ограничена"
    : hasPublicUrl
      ? "Открыта для гостей"
      : "Нужно настроить адрес";
  const heroTitle = dashboardStats.isPublicRestricted
    ? "Витрина ждёт продления доступа"
    : hasPublicUrl
      ? "Ваша публичная страница"
      : "Подготовьте публичную ссылку для гостей";
  const heroDescription = dashboardStats.isPublicRestricted
    ? "Данные кабинета сохранены. После ручного продления подписки публичная страница и новые заявки снова станут доступны."
    : hasPublicUrl
      ? "Номера, цены и свободные даты — по одной ссылке."
      : "Заполните адрес публичной страницы в настройках, чтобы отправлять гостям одну персональную ссылку на ваши варианты размещения.";

  return (
    <>
      {dashboardStats.loadState === "demo" ? (
        <InlineNotice title="Демонстрационный режим" tone="soft">
          На странице показаны тестовые данные. Действия, требующие сохранения, недоступны без Supabase.
        </InlineNotice>
      ) : null}

      {dashboardStats.isPublicRestricted ? (
        <OwnerDashboardActionSection
          title="Продление доступа"
          description="Публичные страницы и новые заявки временно недоступны. Кабинет и редактирование данных продолжают работать."
          href="/dashboard/subscription"
          actionLabel="Открыть подписку"
          buttonVariant="secondary"
        >
          <div className="grid border-t border-[var(--border)] pt-4">
            <div className="grid gap-1.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
              <span className="text-sm text-[var(--text-muted)]">Как продлить</span>
              <strong className="text-sm text-[var(--text)]">Свяжитесь с администратором и подтвердите оплату</strong>
            </div>
          </div>
        </OwnerDashboardActionSection>
      ) : null}

      {dashboardStats.subscriptionWarningText ? <InlineNotice tone="warning">{dashboardStats.subscriptionWarningText}</InlineNotice> : null}

      <Panel as="section" aria-label="Сводка кабинета" className="grid grid-cols-3 overflow-hidden divide-x divide-[var(--border)]">
        {[
          { label: "Объекты", value: dashboardStats.objects, hint: "Открыть", href: "/dashboard/properties" },
          { label: "Номера", value: dashboardStats.rooms, hint: `${dashboardStats.activeRooms} активных`, href: "/dashboard/properties" },
          { label: "Новые заявки", value: dashboardStats.newRequests, hint: "Посмотреть", href: "/dashboard/requests" },
        ].map((metric, index) => (
          <Link
            key={metric.label}
            href={metric.href}
            aria-label={`${metric.label}: ${metric.value}. ${metric.hint}`}
            className={`group flex min-w-0 flex-col gap-2 p-6 transition-colors hover:bg-[var(--surface-subtle)] focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)] max-[899px]:px-4 max-[899px]:py-5 max-[360px]:px-3 ${index === 2 ? "bg-[var(--surface-subtle)]" : ""}`}
          >
            <span className="text-[13px] leading-[18px] text-[var(--text-muted)] max-[360px]:min-h-9 max-[480px]:text-xs">{metric.label}</span>
            <span className="text-[32px] font-semibold leading-9 tracking-[-0.025em] max-[899px]:text-[28px]">{metric.value}</span>
            <span className="mt-1 flex items-center gap-2 text-[13px] leading-5 text-[var(--accent)] max-[480px]:text-xs">
              {metric.hint}
              <span className="max-[480px]:hidden" aria-hidden="true">
                <AppIcon icon={ArrowRight} className="!size-4" strokeWidth={1.7} />
              </span>
            </span>
          </Link>
        ))}
      </Panel>

      {emptyStatesToShow.length > 0 ? <OwnerDashboardOnboarding onboarding={dashboardStats.onboarding} emptyStates={emptyStatesToShow} /> : null}

      <div className="grid grid-cols-1 gap-6 min-[900px]:grid-cols-[minmax(0,1.25fr)_minmax(260px,1fr)] min-[900px]:gap-x-7">
        <section className="min-w-0 min-[900px]:col-start-1 min-[900px]:row-start-2" aria-labelledby="owner-quick-actions-title">
          <h2 id="owner-quick-actions-title" className="mb-3 text-lg font-semibold leading-[26px] tracking-[-0.015em]">Продолжить работу</h2>
          <div className="divide-y divide-[var(--border)]">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group grid min-w-0 grid-cols-[40px_minmax(0,1fr)_18px] items-center gap-3 py-4 transition-colors hover:bg-[var(--surface-subtle)] focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <span className="grid size-10 place-items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]" aria-hidden="true">
                  <AppIcon icon={action.icon} className="!size-[18px]" strokeWidth={1.7} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-[15px] font-medium leading-[21px]">{action.title}</strong>
                  <span className="mt-1 block text-[13px] leading-5 text-[var(--text-muted)]">{action.text}</span>
                </span>
                <AppIcon icon={ChevronRight} className="!size-[18px] text-[var(--text-muted)]" strokeWidth={1.7} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <Panel as="article" padding="lg" className="flex items-center justify-between gap-6 min-[900px]:col-span-2 min-[900px]:row-start-1 max-[899px]:flex-col max-[899px]:items-stretch max-[899px]:!p-5 max-[360px]:!p-4">
          <div className="min-w-0">
            <p className="mb-3 flex items-center gap-2 text-[13px] font-medium leading-5 text-[var(--text-muted)]">
              <span className={`size-1.5 shrink-0 rounded-full ${dashboardStats.isPublicRestricted || !hasPublicUrl ? "bg-[var(--warning)]" : "bg-[var(--accent)]"}`} aria-hidden="true" />
              {publicStatusLabel}
            </p>
            <h2 className="text-lg font-semibold leading-[26px] tracking-[-0.015em]">{heroTitle}</h2>
            <p className="mt-2 max-w-[40rem] text-sm leading-[21px] text-[var(--text-muted)]">{heroDescription}</p>
          </div>
          <ButtonLink href={publicPageHref} variant="secondary" className="shrink-0">
            {hasPublicUrl ? "Открыть страницу" : "Настроить ссылку"}
            <AppIcon icon={ExternalLink} className="!size-[18px]" strokeWidth={1.7} aria-hidden="true" />
          </ButtonLink>
        </Panel>

        <aside className="grid min-w-0 content-start gap-4 min-[900px]:col-start-2 min-[900px]:row-start-2" aria-label="Подписка и приглашения">
          <Panel padding="lg" className="max-[899px]:!p-5 max-[360px]:!p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold leading-[26px] tracking-[-0.015em]">Подписка</h2>
              <span className="inline-flex min-h-7 items-center rounded-full bg-[var(--surface-subtle)] px-3 text-xs font-medium text-[var(--accent)]">{dashboardStats.subscriptionPlan}</span>
            </div>
            <dl className="mt-4 text-[13px] leading-5">
              <div className="flex items-center justify-between gap-4 py-2">
                <dt className="text-[var(--text-muted)]">Статус</dt>
                <dd className="text-right font-medium">{dashboardStats.subscriptionStatusLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4 pt-2">
                <dt className="text-[var(--text-muted)]">Действует до</dt>
                <dd className="text-right font-medium">{dashboardStats.subscriptionValidUntil}</dd>
              </div>
            </dl>
            <Link href="/dashboard/subscription" className="mt-2 inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold text-[var(--accent)] underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
              Открыть подписку
              <AppIcon icon={ArrowRight} className="!size-[18px]" strokeWidth={1.7} aria-hidden="true" />
            </Link>
          </Panel>

          <Link href="/dashboard/referrals" className="grid grid-cols-[20px_minmax(0,1fr)_18px] items-start gap-3 rounded-lg py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
            <AppIcon icon={UserPlus} className="mt-0.5 !size-5 text-[var(--accent)]" strokeWidth={1.7} aria-hidden="true" />
            <span>
              <strong className="block text-[13px] font-medium leading-5">Пригласить владельца или агента</strong>
              <span className="mt-1 block text-[13px] leading-5 text-[var(--text-muted)]">Поделиться персональной ссылкой</span>
            </span>
            <AppIcon icon={ArrowRight} className="mt-0.5 !size-[18px] text-[var(--accent)]" strokeWidth={1.7} aria-hidden="true" />
          </Link>
        </aside>
      </div>
      {emptyStatesToShow.length === 0 ? <OwnerDashboardOnboarding onboarding={dashboardStats.onboarding} emptyStates={emptyStatesToShow} /> : null}
    </>
  );
}
