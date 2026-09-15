import { redirect } from "next/navigation";

import { getAgentDashboardSummary } from "@/entities/collaboration";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { ButtonLink, InlineNotice, Panel, SectionHeader, StatCard } from "@/shared/ui";
import { OwnerDashboardActionSection } from "@/widgets/owner-dashboard-overview/owner-dashboard-action-section";
import { CopyLinkButton } from "@/widgets/property-admin";
import { SubscriptionOverviewCard } from "@/widgets/subscription-status-card";

export default async function AgentDashboardPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const [summary, subscription] = await Promise.all([
    getAgentDashboardSummary(profile),
    getSubscriptionRuntimeState(profile.id, "agent"),
  ]);

  if (summary.loadState === "unavailable") {
    return (
      <InlineNotice title="Не удалось загрузить данные кабинета" tone="warning" aria-live="polite">
        Статистика и действия временно недоступны. Обновите страницу позже.
      </InlineNotice>
    );
  }

  return (
    <div className="grid gap-4">
      <Panel className="grid gap-5 p-5 max-[640px]:p-4" surface="raised">
        <SectionHeader
          title="Агентская витрина"
          description="Персональная ссылка, активные сотрудничества и заявки по вашим каналам."
        />

        <div className="grid gap-3 md:grid-cols-3">
          <StatCard title="Активные связи" value={summary.activeCollaborations} subtitle="Объекты и отдельные номера" />
          <StatCard title="Новые заявки" value={summary.incomingRequests} subtitle="Ожидают вашего действия" />
          <StatCard title="Завершенные сделки" value={summary.completedDeals} subtitle="Статус ставит владелец" />
        </div>

        <section className="grid gap-3 rounded-[20px] border border-[rgb(var(--color-primary-rgb)_/_0.16)] bg-[var(--color-primary-pale)] p-4">
          <div className="grid gap-1.5">
            <strong className="text-base text-[var(--text)]">Публичная ссылка агента</strong>
            <p className="break-all text-sm leading-relaxed text-[var(--text-muted)]">
              {summary.publicLinkLabel || "Ссылка создается автоматически для профиля агента."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href={summary.publicLinkHref ?? "#"} variant="secondary" disabled={!summary.publicLinkHref}>
              Открыть витрину
            </ButtonLink>
            {summary.publicLinkHref ? <CopyLinkButton path={summary.publicLinkHref} /> : null}
            <ButtonLink href="/agent/dashboard/opportunities">Найти объекты</ButtonLink>
          </div>
        </section>
      </Panel>

      <Panel className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
        <SectionHeader title="Ближайшие шаги агента" description="Последовательный путь от профиля до передачи заявки владельцу." />
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            "Заполните контакты, которые увидит гость по агентской ссылке.",
            "Отправьте предложение владельцу по объекту или отдельному номеру.",
            "После принятия связи настройте цену и передавайте заявки владельцу вручную.",
          ].map((step, index) => (
            <li key={step} className="grid gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <span className="grid size-9 place-items-center rounded-[14px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-sm font-extrabold text-[var(--color-primary-hover)]">
                {index + 1}
              </span>
              <strong className="text-sm leading-relaxed text-[var(--text)]">{step}</strong>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
          <SectionHeader title="Сделки" description="Только владелец может отметить принятую заявку завершенной." />
          <ButtonLink href="/agent/dashboard/deals" variant="secondary">Открыть сделки</ButtonLink>
        </Panel>
        <SubscriptionOverviewCard subscription={subscription} href="/agent/dashboard/subscription" />
      </div>

      <OwnerDashboardActionSection
        title="Приглашения"
        description="Подготовьте персональную ссылку для владельца или агента. Роль выбирается на следующем экране."
        href="/dashboard/referrals"
        actionLabel="Пригласить"
        buttonSize="sm"
      />
    </div>
  );
}
