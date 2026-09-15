import type { SubscriptionRuntimeState } from "@/entities/subscription";
import { formatDateLabel } from "@/shared/lib/date";
import { ButtonLink, InlineNotice, Panel, StatCard, StatusPill } from "@/shared/ui";

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
    return "Доступ ограничен до ручного продления администратором. Публичная страница скрыта, новые заявки и изменения данных временно остановлены.";
  }

  return null;
}

function getPublicSurfaceLabel(roleContext: SubscriptionRuntimeState["roleContext"]) {
  return roleContext === "agent" ? "Агентская витрина" : "Публичные страницы";
}

function getPublicSurfaceAvailabilityLabel(roleContext: SubscriptionRuntimeState["roleContext"], isAllowed: boolean) {
  if (roleContext === "agent") {
    return isAllowed ? "Доступна" : "Скрыта";
  }

  return isAllowed ? "Доступны" : "Скрыты";
}

function getSubscriptionDescription(roleContext: SubscriptionRuntimeState["roleContext"]) {
  return roleContext === "agent"
    ? "Статус доступа агентской витрины, лимит активных номеров и ручное продление в рамках MVP."
    : "Статус доступа, лимит активных номеров и ручное продление в рамках MVP.";
}

export function SubscriptionOverviewCard({ subscription, href }: SubscriptionOverviewCardProps) {
  const rows = [
    { label: "Действует до", value: getValidityLabel(subscription.validUntil) },
    { label: "План", value: subscription.planName },
    { label: "Активные номера", value: getRoomUsageLabel(subscription.activeRoomCount, subscription.roomLimit) },
  ];

  return (
    <Panel as="article" className="grid content-between gap-4 p-5" surface="raised">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-lg text-[var(--text)]">Подписка</strong>
        <StatusPill variant={getStatusVariant(subscription.status)}>{subscription.statusLabel}</StatusPill>
      </div>
      <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1.5 border-b border-[var(--border)] px-3.5 py-3 last:border-b-0 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
            <span className="text-xs text-[var(--text-muted)]">{row.label}</span>
            <strong className="text-sm text-[var(--text)]">{row.value}</strong>
          </div>
        ))}
      </div>
      <ButtonLink href={href} variant={subscription.status === "expired" ? "primary" : "secondary"} fullWidth>
        Открыть подписку
      </ButtonLink>
    </Panel>
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
  const renewalSteps = [
    ["Шаг 1", "Оплатите доступ вне автоматического платежного контура."],
    ["Шаг 2", "Свяжитесь с администратором и подтвердите оплату."],
    ["Шаг 3", "Администратор вручную продлит доступ."],
  ] as const;
  const accessRows = [
    ["Лимит активных номеров", subscription.isRoomLimitReached ? "Исчерпан" : "Доступен"],
    [publicSurfaceLabel, getPublicSurfaceAvailabilityLabel(subscription.roleContext, subscription.isPublicAllowed)],
    ["Новые заявки", subscription.isRequestIntakeAllowed ? "Принимаются" : "Не принимаются"],
    ["Изменения в кабинете", subscription.isMutationAllowed ? "Доступны" : "Остановлены"],
  ] as const;

  return (
    <section className="grid gap-5">
      {warning ? <InlineNotice tone="warning">{warning}</InlineNotice> : null}

      <Panel className="grid gap-5 p-5 max-[640px]:p-4" surface="raised">
        <div className="flex items-start justify-between gap-4 max-[640px]:flex-col">
          <div className="grid gap-1.5">
            <h1 className="text-2xl font-extrabold leading-tight text-[var(--text)]">Подписка</h1>
            <p className="max-w-2xl text-sm leading-[1.55] text-[var(--text-muted)]">
              {getSubscriptionDescription(subscription.roleContext)}
            </p>
          </div>
          <StatusPill variant={getStatusVariant(subscription.status)}>{subscription.statusLabel}</StatusPill>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
      </Panel>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Panel className="grid content-start gap-4 p-5" surface="raised">
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-tight text-[var(--text)]">Как продлить в MVP</h2>
            <p className="text-sm leading-[1.55] text-[var(--text-muted)]">
              Продление доступа выполняется вручную. Онлайн-оплаты в кабинете сейчас нет.
            </p>
          </div>

          <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
            {renewalSteps.map(([label, value]) => (
              <div key={label} className="grid gap-1.5 border-b border-[var(--border)] px-4 py-3 last:border-b-0 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-center">
                <span className="text-xs text-[var(--text-muted)]">{label}</span>
                <strong className="text-sm leading-[1.45] text-[var(--text)]">{value}</strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel as="aside" className="grid content-start gap-4 p-5" surface="raised">
          <div className="grid gap-1.5">
            <h2 className="text-xl font-semibold leading-tight text-[var(--text)]">Что доступно сейчас</h2>
            <p className="text-sm leading-[1.55] text-[var(--text-muted)]">Ограничения применяются одинаково во всех точках входа.</p>
          </div>

          <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
            {accessRows.map(([label, value]) => (
              <div key={label} className="grid gap-1.5 border-b border-[var(--border)] px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <span className="text-sm text-[var(--text-muted)]">{label}</span>
                <strong className="text-sm text-[var(--text)]">{value}</strong>
              </div>
            ))}
          </div>

          <p className="text-sm leading-[1.55] text-[var(--text-muted)]">{roomLimitNote}</p>

          <ButtonLink href={backHref} variant="secondary" fullWidth>
            {backLabel}
          </ButtonLink>
        </Panel>
      </section>
    </section>
  );
}
