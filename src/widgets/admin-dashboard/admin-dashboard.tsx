import type { AdminDashboardData } from "@/entities/admin";
import { Button, Panel } from "@/shared/ui";

import {
  extendSubscriptionAction,
  saveSubscriptionAction,
  toggleProfilePublicVisibilityAction,
  togglePropertyFreezeAction,
} from "@/app/admin/actions";

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Не задано";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

type AdminDashboardProps = {
  data: AdminDashboardData;
  message: string;
};

export function AdminDashboard({ data, message }: AdminDashboardProps) {
  const topStats = [
    ["Всего пользователей", String(data.userCount)],
    ["Владельцы", String(data.ownerCount)],
    ["Агенты", String(data.agentCount)],
    ["С двумя ролями", String(data.dualRoleCount)],
    ["Активные подписки", String(data.activeSubscriptionCount)],
    ["Оплачивают сейчас", String(data.paidUserCount)],
    ["Скоро истекают", String(data.expiringSoonCount)],
    ["Замороженные объекты", String(data.frozenPropertyCount)],
  ];

  const activityStats = [
    ["Объекты", String(data.propertyCount)],
    ["Номера", String(data.roomCount)],
    ["Всего заявок", String(data.requestCount)],
    ["Заявки владельцев", String(data.ownerRequestCount)],
    ["Заявки агентов", String(data.agentRequestCount)],
    ["Передано владельцу", String(data.transferredRequestCount)],
    ["Завершено", String(data.completedRequestCount)],
    ["Коллекции", String(data.collectionCount)],
  ];

  return (
    <main className="br-page br-page--dashboard">
      <div className="br-container br-dashboard-layout">
        <section className="br-admin-header">
          <div>
            <h1>Админ-панель</h1>
            <p>Операционный кабинет Bronly: пользователи, подписки, заявки и доступность объектов.</p>
          </div>
        </section>

        {message ? <div className="br-inline-notice">{message}</div> : null}

        <section className="br-admin-stats">
          {topStats.map(([label, value]) => (
            <Panel key={label} as="article" className="br-admin-stat">
              <span>{label}</span>
              <strong>{value}</strong>
            </Panel>
          ))}
        </section>

        <section className="br-admin-stats">
          {activityStats.map(([label, value]) => (
            <Panel key={label} as="article" className="br-admin-stat">
              <span>{label}</span>
              <strong>{value}</strong>
            </Panel>
          ))}
        </section>

        <section className="br-admin-grid" style={{ gridTemplateColumns: "1fr" }}>
          <Panel className="br-dashboard-block">
            <div className="br-dashboard-block__header">
              <div>
                <h2>Пользователи</h2>
                <p>Роли, контакты, публичные ссылки и админское скрытие owner/agent страниц.</p>
              </div>
            </div>
            <div className="br-table">
              <div className="br-table__head">
                <span>Пользователь</span>
                <span>Контакт</span>
                <span>Публичные ссылки</span>
                <span>Объекты</span>
                <span>Роли</span>
                <span>Заявки</span>
                <span>Действие</span>
              </div>
              {data.users.map((row) => (
                <div key={row.profileId} className="br-table__row">
                  <span>{row.displayName}</span>
                  <span>{row.phone || row.slug || "Не указан"}</span>
                  <span>
                    {row.publicPageUrls.length ? (
                      <>
                        {row.publicPageUrls.join(", ")}
                        <br />
                        <small>{row.isPublicHiddenByAdmin ? "Скрыты админом" : "Доступны"}</small>
                      </>
                    ) : (
                      "Нет публичных ссылок"
                    )}
                  </span>
                  <span>{row.propertyCount}</span>
                  <span>{row.roles.join(", ")}</span>
                  <span>{row.requestCount}</span>
                  <span>
                    {row.publicPageUrls.length ? (
                      <form action={toggleProfilePublicVisibilityAction}>
                        <input type="hidden" name="profileId" value={row.profileId} />
                        <input type="hidden" name="nextHidden" value={row.isPublicHiddenByAdmin ? "false" : "true"} />
                        <button className="br-button br-button--secondary" type="submit">
                          {row.isPublicHiddenByAdmin ? "Вернуть страницы" : "Скрыть страницы"}
                        </button>
                      </form>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="br-dashboard-block">
            <div className="br-dashboard-block__header">
              <div>
                <h2>Подписки</h2>
                <p>Ручное продление и настройка доступов по контекстам owner и agent.</p>
              </div>
            </div>
            <div className="br-owner-stack">
              {data.subscriptions.map((row) => (
                <form key={`${row.profileId}-${row.roleContext}`} action={saveSubscriptionAction} className="br-owner-inline-form">
                  <input type="hidden" name="profileId" value={row.profileId} />
                  <input type="hidden" name="roleContext" value={row.roleContext} />
                  <div className="br-form-field">
                    <label className="br-label">Пользователь</label>
                    <input className="br-field" value={row.displayName} disabled />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">Контекст</label>
                    <input className="br-field" value={row.roleContext} disabled />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">Статус</label>
                    <select className="br-field" name="status" defaultValue={row.status}>
                      <option value="trial">trial</option>
                      <option value="active">active</option>
                      <option value="grace">grace</option>
                      <option value="expired">expired</option>
                      <option value="manual">manual</option>
                    </select>
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">План</label>
                    <input className="br-field" name="planName" defaultValue={row.planName} />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">Лимит номеров</label>
                    <input className="br-field" name="activeRoomLimit" defaultValue={row.activeRoomLimit ?? ""} />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">Активные номера</label>
                    <input className="br-field" value={String(row.activeRoomCount)} disabled />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">Доступ до</label>
                    <input className="br-field" value={formatDateLabel(row.validUntil)} disabled />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">Оплачено до</label>
                    <input className="br-field" name="paidUntil" type="date" defaultValue={formatDateInputValue(row.paidUntil)} />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">Grace period до</label>
                    <input className="br-field" name="graceEndsAt" type="date" defaultValue={formatDateInputValue(row.graceEndsAt)} />
                  </div>
                  <div className="br-owner-actions">
                    <Button type="submit" variant="secondary">
                      Сохранить
                    </Button>
                    <button className="br-button br-button--primary" type="submit" formAction={extendSubscriptionAction}>
                      Продлить на 30 дней
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </Panel>

          <Panel className="br-dashboard-block">
            <div className="br-dashboard-block__header">
              <div>
                <h2>Объекты</h2>
                <p>Заморозка и разморозка конкретного объекта без изменения его публикации.</p>
              </div>
            </div>
            <div className="br-table">
              <div className="br-table__head">
                <span>Объект</span>
                <span>Владелец</span>
                <span>Статус</span>
                <span>Номера</span>
                <span>Действие</span>
              </div>
              {data.properties.map((row) => (
                <div key={row.propertyId} className="br-table__row">
                  <span>
                    {row.title}
                    <br />
                    <small>/p/{row.slug}</small>
                  </span>
                  <span>{row.ownerName}</span>
                  <span>{row.isFrozen ? "Заморожен" : row.published ? "Опубликован" : "Скрыт"}</span>
                  <span>
                    {row.activeRoomCount} / {row.totalRoomCount}
                  </span>
                  <span>
                    <form action={togglePropertyFreezeAction}>
                      <input type="hidden" name="propertyId" value={row.propertyId} />
                      <input type="hidden" name="nextFrozen" value={row.isFrozen ? "false" : "true"} />
                      <button className="br-button br-button--secondary" type="submit">
                        {row.isFrozen ? "Разморозить" : "Заморозить"}
                      </button>
                    </form>
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
