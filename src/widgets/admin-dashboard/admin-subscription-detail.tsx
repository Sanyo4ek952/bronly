import type { AdminSubscriptionDetailData } from "@/entities/admin";
import { formatDateLabel, formatDateTimeLabel } from "@/shared/lib/date";
import { ButtonLink, Panel, StatusPill } from "@/shared/ui";
import { AdminPageHeader } from "@/widgets/property-admin";

const paymentMethodLabels = {
  bank_transfer: "Банковский перевод",
  cash: "Наличные",
  other: "Другое",
} as const;

const eventLabels = {
  trial_started: "Начат пробный период",
  payment_recorded: "Зарегистрирована оплата",
  free_extension: "Добавлены бесплатные дни",
  room_limit_changed: "Изменён лимит номеров",
  access_ended: "Доступ завершён",
} as const;

function formatRubles(amountKopecks: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 })
    .format(amountKopecks / 100);
}

function getRolesLabel(roles: AdminSubscriptionDetailData["subscription"]["roles"]) {
  if (roles.includes("owner") && roles.includes("agent")) return "Владелец и агент";
  return roles.includes("owner") ? "Владелец" : "Агент";
}

export function AdminSubscriptionDetail({ data }: { data: AdminSubscriptionDetailData }) {
  const { subscription } = data;

  return (
    <section className="grid gap-[14px] rounded-[24px] border border-[var(--border)] bg-[rgb(255_255_255_/_0.95)] p-[18px] shadow-[var(--shadow-md)] max-[720px]:rounded-[22px] max-[720px]:p-3.5">
      <AdminPageHeader
        variant="plain"
        title={subscription.displayName}
        description={`${getRolesLabel(subscription.roles)} · единая подписка Bronly`}
        actions={<ButtonLink href={`/admin/subscriptions?focus=${subscription.profileId}`} variant="secondary">Управлять подпиской</ButtonLink>}
      />

      <Panel className="grid gap-3.5 rounded-[22px] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill variant={subscription.status === "active" ? "active" : subscription.status === "expired" ? "inactive" : subscription.status === "grace" ? "pending" : "neutral"}>
            {subscription.statusLabel}
          </StatusPill>
          <span className="text-sm text-[var(--text-muted)]">
            {subscription.activeRoomCount} из {subscription.roomLimit} активных номеров
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3.5 max-[720px]:grid-cols-1">
          <div><span className="text-xs text-[var(--text-muted)]">Доступ до</span><strong className="mt-1 block text-sm">{subscription.validUntil ? formatDateLabel(subscription.validUntil) : "Не задано"}</strong></div>
          <div><span className="text-xs text-[var(--text-muted)]">Оплачено до</span><strong className="mt-1 block text-sm">{subscription.paidUntil ? formatDateLabel(subscription.paidUntil) : "Нет оплаты"}</strong></div>
          <div><span className="text-xs text-[var(--text-muted)]">Индивидуальный лимит</span><strong className="mt-1 block text-sm">{subscription.roomLimitOverride ?? "Не задан"}</strong></div>
        </div>
      </Panel>

      <Panel className="grid gap-3.5 rounded-[22px] p-4">
        <div><h2 className="text-lg font-semibold text-[var(--text)]">Платежи</h2><p className="text-sm text-[var(--text-muted)]">Зарегистрированные оплаты не смешиваются с бесплатными продлениями.</p></div>
        {data.payments.length ? data.payments.map((payment) => (
          <article key={payment.id} className="grid gap-2 rounded-[18px] border border-[var(--border)] p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <strong>{formatRubles(payment.amountKopecks)} · {payment.billingPeriod === "year" ? "365 дней" : "30 дней"}</strong>
              <span className="text-sm text-[var(--text-muted)]">{formatDateLabel(payment.paidAt)}</span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">{paymentMethodLabels[payment.paymentMethod]} · внёс {payment.recordedBy}</p>
            {payment.externalReference ? <p className="text-sm">Операция: {payment.externalReference}</p> : null}
            {payment.note ? <p className="text-sm">{payment.note}</p> : null}
          </article>
        )) : <p className="text-sm text-[var(--text-muted)]">Зарегистрированных оплат пока нет.</p>}
      </Panel>

      <Panel className="grid gap-3.5 rounded-[22px] p-4">
        <div><h2 className="text-lg font-semibold text-[var(--text)]">История действий</h2><p className="text-sm text-[var(--text-muted)]">Кто, когда и почему менял подписку.</p></div>
        {data.auditEvents.length ? data.auditEvents.map((event) => {
          const reason = typeof event.details.reason === "string" ? event.details.reason : null;
          return (
            <article key={event.id} className="grid gap-1.5 border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <strong className="text-sm">{eventLabels[event.eventType]}</strong>
                <span className="text-xs text-[var(--text-muted)]">{formatDateTimeLabel(event.createdAt)}</span>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{event.actorName}{event.extensionDays ? ` · ${event.extensionDays} дней` : ""}</p>
              {reason ? <p className="text-sm">Причина: {reason}</p> : null}
            </article>
          );
        }) : <p className="text-sm text-[var(--text-muted)]">История появится после первого действия.</p>}
      </Panel>
    </section>
  );
}
