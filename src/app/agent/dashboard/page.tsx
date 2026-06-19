import Link from "next/link";
import { redirect } from "next/navigation";

import { getAgentDashboardSummary } from "@/entities/collaboration";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { ButtonLink, SectionSubtitle } from "@/shared/ui";
import { OwnerDashboardActionSection } from "@/widgets/owner-dashboard-overview/owner-dashboard-action-section";
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

  return (
    <>
      <section className="br-summary-grid">
        <article className="br-summary-card br-card">
          <div className="br-summary-card__header">
            <strong>Агентская витрина</strong>
            <span className="br-summary-card__badge">Агент</span>
          </div>
          <div className="br-summary-card__rows">
            <div className="br-summary-card__row">
              <span>Публичная ссылка</span>
              {summary.publicLinkHref ? (
                <Link href={summary.publicLinkHref}>
                  <strong>{summary.publicLinkLabel}</strong>
                </Link>
              ) : (
                <strong>{summary.publicLinkLabel}</strong>
              )}
            </div>
            <div className="br-summary-card__row">
              <span>Активные связи</span>
              <strong>{summary.activeCollaborations}</strong>
            </div>
            <div className="br-summary-card__row">
              <span>Новые заявки</span>
              <strong>{summary.incomingRequests}</strong>
            </div>
          </div>
          <Link href="/agent/dashboard/opportunities" className="br-button br-button--primary br-button--full">
            Найти объекты
          </Link>
        </article>
        <article className="br-summary-card br-card">
          <div className="br-summary-card__header">
            <strong>Сделки</strong>
          </div>
          <div className="br-summary-card__rows">
            <div className="br-summary-card__row">
              <span>Завершенные</span>
              <strong>{summary.completedDeals}</strong>
            </div>
            <div className="br-summary-card__row">
              <span>Статус</span>
              <strong>Вручную через владельца</strong>
            </div>
          </div>
          <Link href="/agent/dashboard/deals" className="br-button br-button--secondary br-button--full">
            Открыть сделки
          </Link>
        </article>
        <SubscriptionOverviewCard subscription={subscription} href="/agent/dashboard/subscription" />
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Ближайшие шаги агента</h2>
            <SectionSubtitle>Рабочая схема MVP без лишнего CRM-слоя.</SectionSubtitle>
          </div>
        </div>

        <div className="br-onboarding-grid">
          {[
            "Заполните контакты, которые увидит гость по агентской ссылке.",
            "Откройте раздел «К сотрудничеству», чтобы отправить предложение владельцу.",
            "После принятия связи принимайте заявки и вручную передавайте их владельцу.",
          ].map((step, index) => (
            <article key={step} className="br-onboarding-card br-onboarding-card--current">
              <div className="br-onboarding-card__top">
                <span className="br-onboarding-card__index">{index + 1}</span>
                <span className="br-onboarding-card__status">Следующий шаг</span>
              </div>
              <strong>{step}</strong>
            </article>
          ))}
        </div>
      </section>

      <OwnerDashboardActionSection
        title="Приглашения"
        description="Подготовьте персональную ссылку для владельца или агента. Роль выбирается на следующем экране."
        href="/dashboard/referrals"
        actionLabel="Пригласить"
        buttonSize="sm"
      />
    </>
  );
}
