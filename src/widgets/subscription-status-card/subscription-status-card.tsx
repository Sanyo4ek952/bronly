import {
  SUBSCRIPTION_MONTHLY_PRICE_RUB,
  SUBSCRIPTION_YEARLY_PRICE_RUB,
  type SubscriptionRuntimeState,
} from "@/entities/subscription";
import { formatDateLabel } from "@/shared/lib/date";
import { ButtonLink, InlineNotice, Panel, StatCard, StatusPill } from "@/shared/ui";

type SubscriptionStatusCardProps = {
  subscription: SubscriptionRuntimeState;
  backHref: string;
  backLabel: string;
  presentation?: "default" | "owner";
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

function getRoomUsageLabel(activeRoomCount: number, roomLimit: number) {
  return `${activeRoomCount} из ${roomLimit}`;
}

function getValidityLabel(validUntil: string | null) {
  return validUntil ? formatDateLabel(validUntil) : "Без даты";
}

function getRoomLimitNote(subscription: SubscriptionRuntimeState) {
  if (subscription.isRoomLimitReached) {
    return "Лимит активных номеров исчерпан. Редактирование текущих данных доступно по статусу подписки, но создание нового активного номера или повторная активация неактивного номера будут заблокированы.";
  }

  if (subscription.remainingRoomSlots === 1) {
    return "Доступен еще 1 активный номер в рамках текущего лимита.";
  }

  const remainingRoomSlots = subscription.remainingRoomSlots;
  return `Доступно еще ${remainingRoomSlots} ${getActiveRoomWord(remainingRoomSlots)} в рамках текущего лимита.`;
}

function getWarning(subscription: SubscriptionRuntimeState) {
  if (subscription.status === "grace") {
    return subscription.graceEndsAt
      ? `Grace period действует до ${formatDateLabel(subscription.graceEndsAt)}. До этой даты публичные страницы и новые заявки еще доступны.`
      : "Grace period уже начался. Пока он не завершился, публичные страницы и новые заявки еще доступны.";
  }

  if (subscription.status === "expired") {
    return "Публичная страница скрыта и новые заявки не принимаются до продления. Кабинет и редактирование данных остаются доступными.";
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
    ? "Тариф Bronly для агентской витрины: все функции и до 15 активных номеров."
    : "Тариф Bronly: все функции и до 15 активных номеров.";
}

const subscriptionPriceLabel = `${SUBSCRIPTION_MONTHLY_PRICE_RUB} ₽/месяц или ${SUBSCRIPTION_YEARLY_PRICE_RUB.toLocaleString("ru-RU")} ₽/год`;

function OwnerSubscriptionStatus({
  subscription,
  backHref,
  backLabel,
}: Omit<SubscriptionStatusCardProps, "presentation">) {
  const warning = getWarning(subscription);
  const usageLabel = getRoomUsageLabel(subscription.activeRoomCount, subscription.roomLimit);
  const roomLimitNote = getRoomLimitNote(subscription);
  const validUntilLabel = getValidityLabel(subscription.validUntil);
  const paidUntilLabel = subscription.paidUntil ? formatDateLabel(subscription.paidUntil) : "Нет даты";
  const graceUntilLabel = subscription.graceEndsAt ? formatDateLabel(subscription.graceEndsAt) : "Не действует";
  const accessRows = [
    {
      label: "Лимит активных номеров",
      value: subscription.isRoomLimitReached ? "Исчерпан" : "Доступен",
      isAllowed: !subscription.isRoomLimitReached,
    },
    { label: "Публичные страницы", value: subscription.isPublicAllowed ? "Доступны" : "Скрыты", isAllowed: subscription.isPublicAllowed },
    {
      label: "Новые заявки",
      value: subscription.isRequestIntakeAllowed ? "Принимаются" : "Не принимаются",
      isAllowed: subscription.isRequestIntakeAllowed,
    },
    {
      label: "Изменения в кабинете",
      value: "Доступны",
      isAllowed: true,
    },
  ] as const;
  const renewalSteps = [
    "Оплатите доступ вне автоматического платежного контура.",
    "Свяжитесь с администратором и подтвердите оплату.",
    "Администратор вручную продлит доступ.",
  ] as const;

  return (
    <section className="grid gap-6 max-[640px]:gap-5">
      <header className="grid max-w-[720px] gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">Доступ к сервису</p>
        <h1 className="text-[clamp(32px,5vw,46px)] font-bold leading-[1.02] tracking-[-0.04em] text-[var(--text)]">Подписка</h1>
        <p className="text-sm leading-[1.6] text-[var(--text-muted)]">
          {subscriptionPriceLabel}. Следите за сроком доступа и лимитом активных номеров.
        </p>
      </header>

      {warning ? <InlineNotice tone="warning">{warning}</InlineNotice> : null}

      <Panel
        className="min-w-0 overflow-hidden border-[rgb(var(--color-primary-rgb)_/_0.18)] !bg-[linear-gradient(135deg,var(--surface-muted),var(--surface)_72%)] shadow-[var(--shadow-md)]"
        aria-labelledby="owner-subscription-plan-title"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-7 p-7 max-[640px]:grid-cols-1 max-[640px]:gap-5 max-[640px]:px-4 max-[640px]:py-5">
          <div className="grid min-w-0 gap-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)]">Текущий тариф</span>
            <div className="flex min-w-0 flex-wrap items-center gap-2.5 max-[640px]:items-start">
              <h2
                id="owner-subscription-plan-title"
                className="[overflow-wrap:anywhere] text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--text)] max-[640px]:w-full max-[640px]:text-2xl"
              >
                {subscription.planName}
              </h2>
              <StatusPill variant={getStatusVariant(subscription.status)}>{subscription.statusLabel}</StatusPill>
            </div>
            <p className="max-w-[620px] text-sm leading-[1.55] text-[var(--text-muted)]">
              Доступ к кабинету, публичным страницам и новым заявкам определяется текущим статусом подписки.
            </p>
          </div>

          <div className="min-w-[180px] border-l border-[rgb(var(--color-primary-rgb)_/_0.2)] pl-7 max-[640px]:min-w-0 max-[640px]:border-l-0 max-[640px]:border-t max-[640px]:pl-0 max-[640px]:pt-5">
            <span className="block text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)]">Активные номера</span>
            <strong className="mt-2 block [overflow-wrap:anywhere] text-[32px] font-extrabold leading-none tracking-[-0.04em] text-[var(--text)]">
              {usageLabel}
            </strong>
            <small className="mt-2 block text-xs leading-[1.45] text-[var(--text-muted)]">
              {subscription.isRoomLimitReached
                ? "Лимит активных номеров исчерпан"
                : `Доступно еще ${subscription.remainingRoomSlots} ${getActiveRoomWord(subscription.remainingRoomSlots)}`}
            </small>
          </div>
        </div>

        <dl className="grid grid-cols-3 border-t border-[rgb(var(--color-primary-rgb)_/_0.16)] max-[640px]:grid-cols-1 max-[640px]:px-4">
          {[
            ["Действует до", validUntilLabel],
            ["Оплачено до", paidUntilLabel],
            ["Grace period", graceUntilLabel],
          ].map(([label, value]) => (
            <div
              key={label}
              className="min-w-0 border-r border-[rgb(var(--color-primary-rgb)_/_0.16)] px-7 py-[18px] last:border-r-0 max-[640px]:border-b max-[640px]:border-r-0 max-[640px]:px-0 max-[640px]:py-4 max-[640px]:last:border-b-0"
            >
              <dt className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)]">{label}</dt>
              <dd className="mt-2 [overflow-wrap:anywhere] text-sm font-bold leading-[1.45] text-[var(--text)]">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(310px,0.8fr)]">
        <Panel className="grid min-w-0 gap-5 p-6 max-[640px]:p-4" surface="raised" aria-labelledby="owner-subscription-access-title">
          <div className="grid gap-1.5">
            <h2 id="owner-subscription-access-title" className="text-2xl font-bold tracking-[-0.025em] text-[var(--text)]">
              Что доступно сейчас
            </h2>
            <p className="text-sm leading-[1.55] text-[var(--text-muted)]">Ограничения применяются одинаково во всех точках входа.</p>
          </div>

          <dl className="border-t border-[var(--border)]">
            {accessRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--border)] py-4 max-[520px]:grid-cols-1 max-[520px]:gap-1.5"
              >
                <dt className="min-w-0 text-sm leading-[1.5] text-[var(--text-muted)]">{row.label}</dt>
                <dd className="flex min-w-0 items-center justify-end gap-2 text-right text-sm font-bold leading-[1.45] text-[var(--text)] max-[520px]:justify-start max-[520px]:text-left">
                  <span
                    className={row.isAllowed ? "size-2 shrink-0 rounded-full bg-[var(--success)]" : "size-2 shrink-0 rounded-full bg-[var(--danger)]"}
                    aria-hidden="true"
                  />
                  <span className="[overflow-wrap:anywhere]">{row.value}</span>
                </dd>
              </div>
            ))}
          </dl>

          <p className="text-sm leading-[1.55] text-[var(--text-muted)]">{roomLimitNote}</p>
        </Panel>

        <Panel as="aside" className="grid min-w-0 gap-5 p-6 max-[640px]:p-4" surface="raised" aria-labelledby="owner-subscription-renewal-title">
          <div className="grid gap-1.5">
            <h2 id="owner-subscription-renewal-title" className="text-2xl font-bold tracking-[-0.025em] text-[var(--text)]">Как продлить</h2>
            <p className="text-sm leading-[1.55] text-[var(--text-muted)]">Онлайн-оплаты в кабинете сейчас нет.</p>
          </div>

          <ol className="m-0 grid list-none p-0 [counter-reset:renewal-step]">
            {renewalSteps.map((step) => (
              <li
                key={step}
                className="grid grid-cols-[30px_minmax(0,1fr)] gap-3 border-t border-[var(--border)] py-4 last:border-b before:grid before:size-[30px] before:place-items-center before:rounded-full before:bg-[var(--surface-muted)] before:text-xs before:font-extrabold before:text-[var(--accent-strong)] before:[content:counter(renewal-step)] before:[counter-increment:renewal-step]"
              >
                <strong className="min-w-0 [overflow-wrap:anywhere] text-sm leading-[1.5] text-[var(--text)]">{step}</strong>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <ButtonLink href={backHref} variant="secondary" className="min-h-11 justify-self-start max-[420px]:w-full">
        {backLabel}
      </ButtonLink>
    </section>
  );
}

export function SubscriptionOverviewCard({ subscription, href }: SubscriptionOverviewCardProps) {
  const rows = [
    { label: "Действует до", value: getValidityLabel(subscription.validUntil) },
    { label: "Тариф", value: subscription.planName },
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

export function SubscriptionStatusCard({ subscription, backHref, backLabel, presentation = "default" }: SubscriptionStatusCardProps) {
  if (presentation === "owner") {
    return <OwnerSubscriptionStatus subscription={subscription} backHref={backHref} backLabel={backLabel} />;
  }

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
    ["Изменения в кабинете", "Доступны"],
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
          <StatCard title="Тариф" value={subscription.planName} subtitle={subscriptionPriceLabel} />
          <StatCard
            title="Активные номера"
            value={usageLabel}
            subtitle={
              subscription.isRoomLimitReached
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
