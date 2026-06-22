import Link from "next/link";

import type { NotificationListItem } from "@/entities/notification";
import { SectionHeader, SubmitButton } from "@/shared/ui";

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
      <SectionHeader
        title={title}
        description={description}
        className="br-dashboard-block__header"
        actions={
          unreadCount ? (
            <form action={onMarkAllReadAction}>
              <SubmitButton variant="secondary" pendingLabel="РћР±РЅРѕРІР»РµРЅРёРµ">РћС‚РјРµС‚РёС‚СЊ РІСЃРµ РїСЂРѕС‡РёС‚Р°РЅРЅС‹РјРё</SubmitButton>
            </form>
          ) : undefined
        }
      />

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
                    {!item.isRead ? <span className="br-notification-dot" aria-label="РќРѕРІРѕРµ СѓРІРµРґРѕРјР»РµРЅРёРµ" /> : null}
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
                    <SubmitButton pendingLabel="РћР±РЅРѕРІР»РµРЅРёРµ">РћС‚РјРµС‚РёС‚СЊ РїСЂРѕС‡РёС‚Р°РЅРЅС‹Рј</SubmitButton>
                  </form>
                ) : (
                  <span className="br-notification-card__read-label">РџСЂРѕС‡РёС‚Р°РЅРѕ</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="br-empty-state">
          <strong>РџРѕРєР° РЅРµС‚ СѓРІРµРґРѕРјР»РµРЅРёР№</strong>
          <p className="br-owner-muted">РќРѕРІС‹Рµ СЃРѕР±С‹С‚РёСЏ РїРѕ Р·Р°СЏРІРєР°Рј, РїСЂРµРґР»РѕР¶РµРЅРёСЏРј Рё РїРѕРґРїРёСЃРєРµ РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ.</p>
        </div>
      )}
    </section>
  );
}
