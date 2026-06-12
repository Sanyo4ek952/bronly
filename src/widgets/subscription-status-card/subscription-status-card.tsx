import type { SubscriptionRuntimeState } from "@/entities/subscription";
import { formatDateLabel } from "@/shared/lib/date";
import { ButtonLink, Panel, StatCard, StatusPill } from "@/shared/ui";

type SubscriptionStatusCardProps = {
  subscription: SubscriptionRuntimeState;
  backHref: string;
  backLabel: string;
};

type SubscriptionOverviewCardProps = {
  subscription: SubscriptionRuntimeState;
  href: string;
};

function getStatusVariant(status: string) {
  return status === "grace" || status === "expired" ? "inactive" : "active";
}

function getActiveRoomWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "активный номер";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "активных номера";
  }

  return "активных номеров";
}

function getRoomUsageLabel(activeRoomCount: number, roomLimit: number | null) {
  if (roomLimit == null) {
    return `${activeRoomCount} ${getActiveRoomWord(activeRoomCount)}`;
  }

  return `${activeRoomCount} из ${roomLimit}`;
}

function getValidityLabel(validUntil: string | null) {
  return validUntil ? formatDateLabel(validUntil) : "Без даты";
}

function getRoomLimitNote(subscription: SubscriptionRuntimeState) {
  if (subscription.roomLimit == null) {
    return "Текущий лимит не ограничен отдельной настройкой.";
  }

  if (subscription.isRoomLimitReached) {
    return "Лимит активных номеров исчерпан. Редактирование текущих данных доступно по статусу подписки, но создание нового активного номера или повторная активация неактивного номера будут заблокированы.";
  }

  if (subscription.remainingRoomSlots === 1) {
    return "Доступен еще 1 активный номер в рамках текущего лимита.";
  }

  const remainingRoomSlots = subscription.remainingRoomSlots ?? 0;
  return `Доступно еще ${remainingRoomSlots} ${getActiveRoomWord(remainingRoomSlots)} в рамках текущего лимита.`;
}

function getWarning(subscription: SubscriptionRuntimeState) {
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

function getPublicSurfaceLabel(roleContext: SubscriptionRuntimeState["roleContext"]) {
  return roleContext === "agent" ? "Агентская витрина" : "Публичные страницы";
}

function getPublicSurfaceAvailabilityLabel(roleContext: SubscriptionRuntimeState["roleContext"], isAllowed: boolean) {
  if (roleContext === "agent") {
    return isAllowed ? "Доступна" : "Может быть скрыта";
  }

  return isAllowed ? "Доступны" : "Могут быть скрыты";
}

function getSubscriptionDescription(roleContext: SubscriptionRuntimeState["roleContext"]) {
  return roleContext === "agent"
    ? "Статус доступа агентской витрины, лимит активных номеров и ручное продление в рамках MVP."
    : "Статус доступа, лимит активных номеров и ручное продление в рамках MVP.";
}

export function SubscriptionOverviewCard({ subscription, href }: SubscriptionOverviewCardProps) {
  return (
    <article className="br-summary-card br-card">
      <div className="br-summary-card__header">
        <strong>Подписка</strong>
        <span className="br-summary-card__badge">{subscription.statusLabel}</span>
      </div>
      <div className="br-summary-card__rows">
        <div className="br-summary-card__row">
          <span>Действует до</span>
          <strong>{getValidityLabel(subscription.validUntil)}</strong>
        </div>
        <div className="br-summary-card__row">
          <span>План</span>
          <strong>{subscription.planName}</strong>
        </div>
        <div className="br-summary-card__row">
          <span>Активные номера</span>
          <strong>{getRoomUsageLabel(subscription.activeRoomCount, subscription.roomLimit)}</strong>
        </div>
      </div>
      <ButtonLink href={href} variant={subscription.status === "expired" ? "primary" : "secondary"} fullWidth>
        Открыть подписку
      </ButtonLink>
    </article>
  );
}

export function SubscriptionStatusCard({ subscription, backHref, backLabel }: SubscriptionStatusCardProps) {
  const warning = getWarning(subscription);
  const usageLabel = getRoomUsageLabel(subscription.activeRoomCount, subscription.roomLimit);
  const roomLimitNote = getRoomLimitNote(subscription);
  const validUntilLabel = getValidityLabel(subscription.validUntil);
  const paidUntilLabel = subscription.paidUntil ? formatDateLabel(subscription.paidUntil) : null;
  const graceUntilLabel = subscription.graceEndsAt ? formatDateLabel(subscription.graceEndsAt) : null;
  const publicSurfaceLabel = getPublicSurfaceLabel(subscription.roleContext);

  return (
    <section className="br-owner-stack">
      {warning ? <div className="br-inline-notice">{warning}</div> : null}

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Подписка</h2>
            <p>{getSubscriptionDescription(subscription.roleContext)}</p>
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
                : subscription.isRoomLimitReached
                  ? "Лимит активных номеров уже исчерпан"
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
              <span>Лимит активных номеров</span>
              <strong>{subscription.isRoomLimitReached ? "Исчерпан" : "Доступен"}</strong>
            </div>
            <div className="br-summary-card__row">
              <span>{publicSurfaceLabel}</span>
              <strong>{getPublicSurfaceAvailabilityLabel(subscription.roleContext, subscription.isPublicAllowed)}</strong>
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

          <p className="br-owner-muted">{roomLimitNote}</p>

          <ButtonLink href={backHref} variant="secondary" fullWidth>
            {backLabel}
          </ButtonLink>
        </aside>
      </section>
    </section>
  );
}
