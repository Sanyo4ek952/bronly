import type { NotificationListItem } from "@/entities/notification";
import { ButtonLink, Panel, SectionHeader, StatusPill, SubmitButton } from "@/shared/ui";

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
    <Panel className="grid gap-5 p-5 max-[640px]:p-4" surface="raised">
      <SectionHeader
        title={title}
        description={description}
        className="items-start gap-3 max-[640px]:items-stretch"
        actions={
          unreadCount ? (
            <form action={onMarkAllReadAction}>
              <SubmitButton variant="secondary" pendingLabel="Обновление">
                Отметить все прочитанными
              </SubmitButton>
            </form>
          ) : undefined
        }
      />

      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <Panel
              as="article"
              key={item.id}
              className={item.isRead
                ? "grid gap-4 p-4 shadow-none"
                : "grid gap-4 border-[rgb(var(--color-primary-rgb)_/_0.24)] bg-[var(--color-primary-pale)] p-4 shadow-none"}
            >
              <div className="flex items-start justify-between gap-3 max-[640px]:flex-col">
                <div className="grid min-w-0 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-[var(--text)]">{item.title}</strong>
                    {!item.isRead ? <StatusPill variant="new">Новое</StatusPill> : null}
                  </div>
                  <p className="text-sm leading-[1.5] text-[var(--text-muted)]">{item.description}</p>
                </div>
                <time className="shrink-0 text-xs text-[var(--text-muted)]" dateTime={item.createdAt}>
                  {item.createdAtLabel}
                </time>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5 max-[640px]:items-stretch">
                {item.linkPath && item.linkLabel ? (
                  <ButtonLink href={item.linkPath} variant="secondary" size="sm">
                    {item.linkLabel}
                  </ButtonLink>
                ) : <span />}

                {!item.isRead ? (
                  <form action={onMarkReadAction}>
                    <input type="hidden" name="notificationId" value={item.id} />
                    <SubmitButton size="sm" pendingLabel="Обновление">
                      Отметить прочитанным
                    </SubmitButton>
                  </form>
                ) : (
                  <StatusPill variant="neutral">Прочитано</StatusPill>
                )}
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <div className="grid gap-1.5 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-5 text-center">
          <strong className="text-sm text-[var(--text)]">Пока нет уведомлений</strong>
          <p className="text-sm leading-[1.5] text-[var(--text-muted)]">
            Новые события по заявкам, предложениям и подписке появятся здесь.
          </p>
        </div>
      )}
    </Panel>
  );
}
