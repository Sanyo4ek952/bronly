import { getSubscriptionRuntimeState } from "@/entities/subscription";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { formatDateLabel } from "@/shared/lib/date";
import { ButtonLink, Panel, StatCard, StatusPill } from "@/shared/ui";

function getStatusVariant(status: string) {
  return status === "grace" || status === "expired" ? "inactive" : "active";
}

function getRoomUsageLabel(activeRoomCount: number, roomLimit: number | null) {
  if (roomLimit == null) {
    return `${activeRoomCount} активных номеров`;
  }

  return `${activeRoomCount} из ${roomLimit}`;
}

function getValidityLabel(validUntil: string | null) {
  return validUntil ? formatDateLabel(validUntil) : "Без даты";
}

function getWarning(subscription: Awaited<ReturnType<typeof getSubscriptionRuntimeState>>) {
  if (subscription.status === "grace") {
    return subscription.graceEndsAt
      ? `Grace period действует до ${formatDateLabel(subscription.graceEndsAt)}. До этой даты публичные страницы и новые заявки еще доступны.`
      : "Grace period уже начался. Пока он не завершился, публичные страницы и новые заявки еще доступны.";
  }

  if (subscription.status === "expired") {
    return "Доступ ограничен до ручного продления администратором. Публичные страницы могут быть скрыты, а новые заявки временно ограничены.";
  }

  return null;
}

export default async function OwnerSubscriptionPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return null;
  }

  const subscription = await getSubscriptionRuntimeState(profile.id, "owner");
  const warning = getWarning(subscription);
  const usageLabel = getRoomUsageLabel(subscription.activeRoomCount, subscription.roomLimit);
  const validUntilLabel = getValidityLabel(subscription.validUntil);
  const paidUntilLabel = subscription.paidUntil ? formatDateLabel(subscription.paidUntil) : null;
  const graceUntilLabel = subscription.graceEndsAt ? formatDateLabel(subscription.graceEndsAt) : null;

  return (
    <section className="br-owner-stack">
      {warning ? <div className="br-inline-notice">{warning}</div> : null}

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Подписка</h2>
            <p>Статус доступа, лимит активных номеров и продление в рамках MVP.</p>
          </div>
          <StatusPill variant={getStatusVariant(subscription.status)}>{subscription.statusLabel}</StatusPill>
        </div>

        <section className="br-summary-grid">
          <StatCard title="Статус" value={subscription.statusLabel} subtitle="Текущий статус подписки" />
          <StatCard title="План" value={subscription.planName} subtitle="План и лимит по активным номерам" />
          <StatCard
            title="Активные номера"
            value={usageLabel}
            subtitle={
              subscription.roomLimit == null
                ? "Лимит не ограничен текущей настройкой"
                : "Занято из доступного лимита"
            }
          />
          <StatCard title="Действует до" value={validUntilLabel} subtitle="Дата окончания текущего доступа" />
          <StatCard
            title="Оплачено до"
            value={paidUntilLabel ?? "Нет даты"}
            subtitle="Дата последнего оплаченного периода"
          />
          <StatCard
            title="Grace period"
            value={graceUntilLabel ?? "Не действует"}
            subtitle="Показываем только когда доступ уже нужно продлить"
          />
        </section>
      </section>

      <section className="br-requests-layout">
        <Panel className="br-dashboard-block">
          <div className="br-dashboard-block__header">
            <div>
              <h2>Как продлить в MVP</h2>
              <p>Продление доступа выполняется вручную. Онлайн-оплаты в кабинете сейчас нет.</p>
            </div>
          </div>

          <div className="br-summary-card__rows">
            <div className="br-summary-card__row">
              <span>Шаг 1</span>
              <strong>Оплатите доступ вне автоматического платежного контура.</strong>
            </div>
            <div className="br-summary-card__row">
              <span>Шаг 2</span>
              <strong>Свяжитесь с администратором и подтвердите оплату.</strong>
            </div>
            <div className="br-summary-card__row">
              <span>Шаг 3</span>
              <strong>Администратор вручную продлит доступ.</strong>
            </div>
          </div>
        </Panel>

        <aside className="br-dashboard-block br-card">
          <div className="br-dashboard-block__header">
            <div>
              <h2>Что важно сейчас</h2>
              <p>Только MVP-правила без отдельного billing cabinet.</p>
            </div>
          </div>

          <div className="br-toggle-list">
            <div className="br-summary-card__row">
              <span>Публичные страницы</span>
              <strong>{subscription.isPublicAllowed ? "Доступны" : "Могут быть скрыты"}</strong>
            </div>
            <div className="br-summary-card__row">
              <span>Новые заявки</span>
              <strong>{subscription.isRequestIntakeAllowed ? "Принимаются" : "Временно ограничены"}</strong>
            </div>
            <div className="br-summary-card__row">
              <span>Изменения в кабинете</span>
              <strong>{subscription.isMutationAllowed ? "Доступны" : "Временно остановлены"}</strong>
            </div>
          </div>

          <ButtonLink href="/dashboard" variant="secondary" fullWidth>
            Вернуться на главную
          </ButtonLink>
        </aside>
      </section>
    </section>
  );
}
