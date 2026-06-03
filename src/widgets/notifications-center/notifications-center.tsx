import Link from "next/link";

import type { NotificationListItem } from "@/entities/notification";

type NotificationsCenterProps = {
  items: NotificationListItem[];
  title: string;
  description: string;
  onMarkReadAction: (formData: FormData) => Promise<void>;
  onMarkAllReadAction: (formData: FormData) => Promise<void>;
};

export function NotificationsCenter({
  items,
  title,
  description,
  onMarkReadAction,
  onMarkAllReadAction,
}: NotificationsCenterProps) {
  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {unreadCount ? (
          <form action={onMarkAllReadAction}>
            <button className="br-button br-button--secondary" type="submit">
              Отметить все прочитанными
            </button>
          </form>
        ) : null}
      </div>

      {items.length ? (
        <div className="br-notification-list">
          {items.map((item) => (
            <article
              key={item.id}
              className={`br-notification-card br-card${item.isRead ? "" : " br-notification-card--unread"}`}
            >
              <div className="br-notification-card__top">
                <div className="br-notification-card__copy">
                  <div className="br-notification-card__title-row">
                    <strong>{item.title}</strong>
                    {!item.isRead ? <span className="br-notification-dot" aria-label="Новое уведомление" /> : null}
                  </div>
                  <p>{item.description}</p>
                </div>
                <time className="br-notification-card__time" dateTime={item.createdAt}>
                  {item.createdAtLabel}
                </time>
              </div>

              <div className="br-notification-card__actions">
                {item.linkPath && item.linkLabel ? (
                  <Link href={item.linkPath} className="br-button br-button--secondary">
                    {item.linkLabel}
                  </Link>
                ) : null}

                {!item.isRead ? (
                  <form action={onMarkReadAction}>
                    <input type="hidden" name="notificationId" value={item.id} />
                    <button className="br-button br-button--primary" type="submit">
                      Отметить прочитанным
                    </button>
                  </form>
                ) : (
                  <span className="br-notification-card__read-label">Прочитано</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="br-empty-state">
          <strong>Пока нет уведомлений</strong>
          <p className="br-owner-muted">Новые события по заявкам, предложениям и подписке появятся здесь.</p>
        </div>
      )}
    </section>
  );
}
