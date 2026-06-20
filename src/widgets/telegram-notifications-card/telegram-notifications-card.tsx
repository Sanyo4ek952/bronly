import type { TelegramNotificationStatus } from "@/entities/notification/api/telegram-link";
import { formatDateTimeLabel } from "@/shared/lib/date";
import { SubmitButton } from "@/shared/ui";

type TelegramNotificationsCardProps = {
  role: "owner" | "agent";
  status: TelegramNotificationStatus;
  action: (formData: FormData) => Promise<void>;
};

export function TelegramNotificationsCard({ role, status, action }: TelegramNotificationsCardProps) {
  const linkedLabel = status.username ? `@${status.username}` : status.chatId ? `chat ${status.chatId}` : "Не привязан";

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Telegram-уведомления</h2>
          <p>Канал для событий по заявкам, предложениям агентов и подписке.</p>
        </div>
      </div>
      <div className="br-toggle-list">
        <div className="br-toggle">
          <span>Статус канала</span>
          <strong>{status.isLinked ? "Привязан" : "Не привязан"}</strong>
        </div>
        <div className="br-toggle">
          <span>Чат</span>
          <strong>{linkedLabel}</strong>
        </div>
        <div className="br-toggle">
          <span>Отправка</span>
          <strong>{status.telegramEnabled ? "Включена" : "Выключена"}</strong>
        </div>
        {status.linkedAt ? (
          <div className="br-toggle">
            <span>Привязан</span>
            <strong>{formatDateTimeLabel(status.linkedAt)}</strong>
          </div>
        ) : null}
      </div>
      <p style={{ marginTop: 16 }}>
        {status.botConfigured
          ? "Откройте бота Bronly и нажмите Start. После привязки уведомления будут приходить в этот чат."
          : "Бот Telegram еще не настроен в окружении. In-app и PWA push продолжают работать."}
      </p>
      <form action={action} style={{ marginTop: 16 }}>
        <input type="hidden" name="role" value={role} />
        <SubmitButton variant="secondary" disabled={!status.botConfigured} pendingLabel="Переход">
          {status.isLinked ? "Перепривязать Telegram" : "Привязать Telegram"}
        </SubmitButton>
      </form>
    </section>
  );
}
