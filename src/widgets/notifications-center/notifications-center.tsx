import type { NotificationListItem } from "@/entities/notification";
import { ButtonLink, Panel, SectionHeader, StatusPill, SubmitButton } from "@/shared/ui";

type NotificationsCenterProps = {
  items: NotificationListItem[];
  title: string;
  description: string;
  onMarkReadAction: (formData: FormData) => Promise<void>;
  onMarkAllReadAction: (formData: FormData) => Promise<void>;
  presentation?: "default" | "owner";
};

function getUnreadCountLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} непрочитанное`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} непрочитанных`;
  }

  return `${count} непрочитанных`;
}

function OwnerNotificationsCenter({
  items,
  title,
  description,
  onMarkReadAction,
  onMarkAllReadAction,
}: Omit<NotificationsCenterProps, "presentation">) {
  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <Panel className="min-w-0 overflow-hidden shadow-[var(--shadow-md)]" aria-labelledby="owner-notifications-title">
      <header className="flex items-start justify-between gap-5 border-b border-[var(--border)] p-6 max-[640px]:grid max-[640px]:gap-4 max-[640px]:px-4 max-[640px]:py-[18px]">
        <div className="grid min-w-0 gap-1.5">
          <h2 id="owner-notifications-title" className="text-[22px] font-bold leading-[1.15] tracking-[-0.025em] text-[var(--text)]">
            {title}
          </h2>
          <p className="text-sm leading-[1.5] text-[var(--text-muted)]">
            {unreadCount ? (
              <>
                <strong className="font-extrabold text-[var(--accent-strong)]">{getUnreadCountLabel(unreadCount)}</strong>
                <span> · {description.toLocaleLowerCase("ru-RU")}</span>
              </>
            ) : (
              "Все события прочитаны."
            )}
          </p>
        </div>

        {unreadCount ? (
          <form action={onMarkAllReadAction} className="shrink-0 max-[640px]:w-full">
            <SubmitButton
              variant="secondary"
              pendingLabel="Обновление"
              className="min-h-11 max-[640px]:w-full"
            >
              Отметить все прочитанными
            </SubmitButton>
          </form>
        ) : null}
      </header>

      {items.length ? (
        <ul className="m-0 list-none p-0">
          {items.map((item) => (
            <li
              key={item.id}
              className={item.isRead
                ? "border-b border-[var(--border)] last:border-b-0"
                : "relative border-b border-[var(--border)] bg-[linear-gradient(90deg,var(--surface-muted),var(--surface)_76%)] before:absolute before:bottom-[18px] before:left-0 before:top-[18px] before:w-[3px] before:rounded-full before:bg-[var(--accent)] last:border-b-0"}
            >
              <article className="grid min-w-0 gap-[14px] px-6 py-5 max-[640px]:px-4 max-[640px]:py-[18px]">
                <div className="flex min-w-0 items-start justify-between gap-4 max-[640px]:grid max-[640px]:gap-2">
                  <div className="grid min-w-0 gap-1.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <strong className="min-w-0 [overflow-wrap:anywhere] text-sm leading-[1.45] text-[var(--text)]">
                        {item.title}
                      </strong>
                      {!item.isRead ? <StatusPill variant="new">Новое</StatusPill> : null}
                    </div>
                    <p className="[overflow-wrap:anywhere] text-sm leading-[1.55] text-[var(--text-muted)]">
                      {item.description}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-[var(--text-muted)]" dateTime={item.createdAt}>
                    {item.createdAtLabel}
                  </time>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-2.5 max-[420px]:grid max-[420px]:grid-cols-1">
                  {item.linkPath && item.linkLabel ? (
                    <ButtonLink
                      href={item.linkPath}
                      variant="secondary"
                      size="sm"
                      className="max-[420px]:min-h-11 max-[420px]:w-full"
                    >
                      {item.linkLabel}
                    </ButtonLink>
                  ) : null}

                  {!item.isRead ? (
                    <form action={onMarkReadAction} className="max-[420px]:w-full">
                      <input type="hidden" name="notificationId" value={item.id} />
                      <SubmitButton
                        size="sm"
                        pendingLabel="Обновление"
                        className="max-[420px]:min-h-11 max-[420px]:w-full"
                      >
                        Отметить прочитанным
                      </SubmitButton>
                    </form>
                  ) : (
                    <StatusPill variant="neutral" className="ml-auto max-[420px]:ml-0 max-[420px]:min-h-11 max-[420px]:justify-center">
                      Прочитано
                    </StatusPill>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid min-h-[330px] place-items-center px-6 py-8 text-center max-[640px]:min-h-[260px] max-[640px]:px-4">
          <div className="grid max-w-[430px] gap-2">
            <strong className="text-lg text-[var(--text)]">Пока нет уведомлений</strong>
            <p className="text-sm leading-[1.55] text-[var(--text-muted)]">
              Новые события по заявкам, предложениям агентов и подписке появятся здесь.
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}

export function NotificationsCenter({
  items,
  title,
  description,
  onMarkReadAction,
  onMarkAllReadAction,
  presentation = "default",
}: NotificationsCenterProps) {
  if (presentation === "owner") {
    return (
      <OwnerNotificationsCenter
        items={items}
        title={title}
        description={description}
        onMarkReadAction={onMarkReadAction}
        onMarkAllReadAction={onMarkAllReadAction}
      />
    );
  }

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
