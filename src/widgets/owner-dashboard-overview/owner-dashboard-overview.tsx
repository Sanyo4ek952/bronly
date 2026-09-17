import { ArrowRight, CalendarDays, ExternalLink, Inbox, Plus } from "lucide-react";
import Link from "next/link";

import type { OwnerDashboardSummary } from "@/entities/property";
import { cn } from "@/shared/lib/cn";
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
      ? "Ваша публичная витрина готова к новым заявкам"
      : "Подготовьте публичную ссылку для гостей";
  const heroDescription = dashboardStats.isPublicRestricted
    ? "Данные кабинета сохранены. После ручного продления подписки публичная страница и новые заявки снова станут доступны."
    : hasPublicUrl
      ? "Гости видят номера, цены и свободные даты по вашей персональной ссылке. После заявки вы связываетесь с ними напрямую."
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

      <Panel
        as="article"
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-7 border-0 bg-[var(--surface-muted)] p-7 shadow-[0_15px_40px_rgb(var(--color-primary-rgb)_/_0.06)] max-[720px]:grid-cols-1 max-[720px]:gap-5 max-[720px]:p-5 max-[360px]:p-4"
      >
        <div className="max-w-[45rem]">
          <p className="mb-5 inline-flex items-center gap-2 text-xs font-extrabold text-[var(--accent-strong)]">
            <span className="size-2 rounded-full bg-[var(--accent)] shadow-[0_0_0_5px_rgb(var(--color-primary-rgb)_/_0.10)]" aria-hidden="true" />
            {publicStatusLabel}
          </p>
          <h2 className="text-[clamp(1.65rem,3vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.035em] text-[var(--text)]">{heroTitle}</h2>
          <p className="mt-3 max-w-[39rem] text-sm leading-[1.65] text-[var(--text-subtle)] sm:text-[15px]">{heroDescription}</p>
        </div>

        <ButtonLink href={publicPageHref} className="min-h-12 self-start px-5 max-[720px]:w-full">
          {hasPublicUrl ? "Открыть страницу" : "Настроить ссылку"}
          <AppIcon icon={ExternalLink} className="size-4" aria-hidden="true" />
        </ButtonLink>

        <dl className="col-span-full grid grid-cols-3 border-t border-[rgb(var(--color-primary-rgb)_/_0.18)] pt-6 max-[420px]:pt-5">
          <div className="flex min-w-0 flex-col border-r border-[rgb(var(--color-primary-rgb)_/_0.18)] pr-5 max-[420px]:pr-2">
            <dt className="order-2 mt-2 text-xs text-[var(--text-subtle)] max-[420px]:text-[10px]">Объекты</dt>
            <dd className="order-1 text-3xl font-semibold leading-none tracking-[-0.04em] text-[var(--text)] max-[420px]:text-2xl">{dashboardStats.objects}</dd>
          </div>
          <div className="flex min-w-0 flex-col border-r border-[rgb(var(--color-primary-rgb)_/_0.18)] px-5 max-[420px]:px-2">
            <dt className="order-2 mt-2 text-xs text-[var(--text-subtle)] max-[420px]:text-[10px]">Номера · {dashboardStats.activeRooms} активных</dt>
            <dd className="order-1 text-3xl font-semibold leading-none tracking-[-0.04em] text-[var(--text)] max-[420px]:text-2xl">{dashboardStats.rooms}</dd>
          </div>
          <div className="flex min-w-0 flex-col pl-5 max-[420px]:pl-2">
            <dt className="order-2 mt-2 text-xs text-[var(--text-subtle)] max-[420px]:text-[10px]">Новые заявки</dt>
            <dd className="order-1 text-3xl font-semibold leading-none tracking-[-0.04em] text-[var(--text)] max-[420px]:text-2xl">{dashboardStats.newRequests}</dd>
          </div>
        </dl>
      </Panel>

      <OwnerDashboardOnboarding onboarding={dashboardStats.onboarding} emptyStates={emptyStatesToShow} />

      <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)] gap-[30px] max-[820px]:grid-cols-1 max-[820px]:gap-6">
        <section aria-labelledby="owner-quick-actions-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="owner-quick-actions-title" className="text-xl font-semibold tracking-[-0.025em] text-[var(--text)]">Продолжить работу</h2>
            <p className="text-xs text-[var(--text-muted)] max-[520px]:hidden">Частые сценарии владельца</p>
          </div>
          <div className="grid grid-cols-2 border-t border-[var(--border)] max-[680px]:grid-cols-1">
            {quickActions.map((action, index) => (
              <Link
                key={action.title}
                href={action.href}
                className={cn(
                  "group grid min-w-0 grid-cols-[42px_minmax(0,1fr)_auto] items-start gap-3 border-b border-[var(--border)] py-[18px] text-inherit transition-colors hover:bg-[rgb(var(--color-primary-rgb)_/_0.035)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)] max-[680px]:px-0",
                  index % 2 === 0 ? "pr-5" : "border-l pl-5 max-[680px]:border-l-0",
                )}
              >
                <span className="grid size-[42px] place-items-center rounded-[var(--radius-md)] bg-[var(--surface-subtle)] text-[var(--accent-strong)]" aria-hidden="true">
                  <AppIcon icon={action.icon} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-[15px] text-[var(--text)]">{action.title}</strong>
                  <span className="mt-1 block text-xs leading-[1.5] text-[var(--text-muted)]">{action.text}</span>
                </span>
                <AppIcon icon={ArrowRight} className="mt-1 size-4 text-[var(--accent-strong)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <aside className="grid content-start gap-4" aria-label="Подписка и приглашения">
          <Panel className="p-5 sm:p-6" surface="raised">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-[-0.025em] text-[var(--text)]">Подписка</h2>
              <span className="inline-flex min-h-7 items-center rounded-full bg-[var(--color-primary-pale)] px-3 text-xs font-bold text-[var(--accent-strong)]">{dashboardStats.subscriptionPlan}</span>
            </div>
            <dl className="mt-4">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 text-xs">
                <dt className="text-[var(--text-muted)]">Статус</dt>
                <dd className="font-bold text-[var(--text)]">{dashboardStats.subscriptionStatusLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 text-xs">
                <dt className="text-[var(--text-muted)]">Действует до</dt>
                <dd className="font-bold text-[var(--text)]">{dashboardStats.subscriptionValidUntil}</dd>
              </div>
            </dl>
            <Link href="/dashboard/subscription" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent-strong)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]">
              Открыть подписку
              <AppIcon icon={ArrowRight} className="size-4" aria-hidden="true" />
            </Link>
          </Panel>

          <Link href="/dashboard/referrals" className="group grid gap-1.5 border-t border-[var(--border)] px-1 py-4 focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]">
            <strong className="inline-flex items-center gap-2 text-[15px] text-[var(--text)]">
              Пригласить владельца или агента
              <AppIcon icon={ArrowRight} className="size-4 text-[var(--accent-strong)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </strong>
            <span className="text-xs leading-[1.55] text-[var(--text-muted)]">Подготовьте персональную ссылку. Роль выбирается на следующем экране.</span>
          </Link>
        </aside>
      </div>
    </>
  );
}
