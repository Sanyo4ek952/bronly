import type { TelegramNotificationStatus } from "@/entities/notification/api/telegram-link";
import { formatDateTimeLabel } from "@/shared/lib/date";
import { Panel, SubmitButton } from "@/shared/ui";

type TelegramNotificationsCardProps = {
  role: "owner" | "agent";
  status: TelegramNotificationStatus;
  linkAction: (formData: FormData) => Promise<void>;
  toggleAction: (formData: FormData) => Promise<void>;
  embedded?: boolean;
};

export function TelegramNotificationsCard({ role, status, linkAction, toggleAction, embedded = false }: TelegramNotificationsCardProps) {
  const linkedLabel = status.username ? `@${status.username}` : status.isLinked ? "Подключен" : "Не привязан";
  const Heading = embedded ? "h3" : "h2";

  const content = (
    <>
      <div className="grid gap-1.5">
        <Heading className="text-lg font-semibold text-[var(--text)]">Telegram-уведомления</Heading>
        <p className="text-sm leading-[1.5] text-[var(--text-muted)]">Канал для событий по заявкам, предложениям агентов и подписке.</p>
      </div>
      <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3.5 py-3 text-sm">
          <span className="text-[var(--text-muted)]">Статус канала</span>
          <strong>{status.isLinked ? "Привязан" : "Не привязан"}</strong>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3.5 py-3 text-sm">
          <span className="text-[var(--text-muted)]">Аккаунт</span>
          <strong>{linkedLabel}</strong>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3.5 py-3 text-sm">
          <span className="text-[var(--text-muted)]">Отправка</span>
          <strong>{status.telegramEnabled ? "Включена" : "Выключена"}</strong>
        </div>
        {status.linkedAt ? (
          <div className="flex items-center justify-between gap-3 px-3.5 py-3 text-sm">
            <span className="text-[var(--text-muted)]">Привязан</span>
            <strong>{formatDateTimeLabel(status.linkedAt)}</strong>
          </div>
        ) : null}
      </div>
      <p className="text-sm leading-[1.5] text-[var(--text-muted)]">
        {status.botConfigured
          ? "Откройте бота Bronly и нажмите Start. После привязки уведомления будут приходить в этот чат."
          : "Бот Telegram еще не настроен в окружении. In-app и PWA push продолжают работать."}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <form action={linkAction}>
          <input type="hidden" name="role" value={role} />
          <SubmitButton variant="secondary" disabled={!status.botConfigured} pendingLabel="Переход">
            {status.isLinked ? "Перепривязать Telegram" : "Привязать Telegram"}
          </SubmitButton>
        </form>
        {status.isLinked ? (
          <form action={toggleAction}>
            <input type="hidden" name="role" value={role} />
            <input type="hidden" name="enabled" value={status.telegramEnabled ? "false" : "true"} />
            <SubmitButton variant="ghost" pendingLabel="Сохранение">
              {status.telegramEnabled ? "Отключить канал" : "Включить канал"}
            </SubmitButton>
          </form>
        ) : null}
      </div>
    </>
  );

  if (embedded) {
    return <section className="grid gap-4">{content}</section>;
  }

  return <Panel className="grid gap-4 p-4" surface="raised">{content}</Panel>;
}
