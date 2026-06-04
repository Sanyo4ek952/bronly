import Link from "next/link";

import type { OwnerDashboardSummary } from "@/entities/property";
import { ButtonLink } from "@/shared/ui";

const quickActions = [
  {
    title: "Добавить номер",
    text: "Создайте новый номер или объект для новых заявок.",
  },
  {
    title: "Календарь занятости",
    text: "Отмечайте занятые даты и периоды недоступности вручную.",
  },
  {
    title: "Заявки",
    text: "Просматривайте новые запросы на проживание и связывайтесь с гостями.",
  },
  {
    title: "Открыть страницу",
    text: "Проверьте, как гость видит ваш объект по публичной ссылке.",
  },
];

const onboardingSteps = [
  {
    title: "Данные владельца",
    text: "Укажите информацию для управления аккаунтом и объектами.",
    status: "Завершено",
    state: "done",
  },
  {
    title: "Создание объекта",
    text: "Добавьте объект размещения: дом, виллу, апартаменты или гостевой дом.",
    status: "Текущий шаг",
    state: "current",
  },
  {
    title: "Первый номер",
    text: "Создайте номер и задайте основную информацию.",
    status: "Ожидает",
    state: "pending",
  },
  {
    title: "Фотографии",
    text: "Загрузите фото объекта и номера, чтобы показать их гостю.",
    status: "Ожидает",
    state: "pending",
  },
  {
    title: "Публичная ссылка",
    text: "Получите персональную ссылку и начните принимать заявки.",
    status: "Ожидает",
    state: "pending",
  },
];

const emptyStates = [
  {
    title: "Нет объектов",
    text: "Добавьте первый объект, чтобы начать принимать заявки по персональной ссылке.",
    action: "Добавить объект",
  },
  {
    title: "Нет номеров",
    text: "В объекте пока нет номеров. Добавьте первый номер, чтобы гости могли оставить заявку.",
    action: "Добавить номер",
  },
];

type OwnerDashboardOverviewProps = {
  dashboardStats: OwnerDashboardSummary;
};

export function OwnerDashboardOverview({ dashboardStats }: OwnerDashboardOverviewProps) {
  const summaryCards = [
    {
      title: "Подписка",
      badge: dashboardStats.subscriptionPlan,
      rows: [
        ["Статус", dashboardStats.subscriptionStatusLabel],
        ["Действует до", dashboardStats.subscriptionValidUntil],
      ],
      href: "/dashboard/subscription",
      action: "Открыть подписку",
    },
    {
      title: "Публичная ссылка",
      rows: [
        ["Адрес", dashboardStats.publicUrl],
        ["Доступ", dashboardStats.isCabinetRestricted ? "Временно ограничен" : "Открыта для гостей"],
      ],
      href: "/dashboard/properties",
      action: "Открыть объекты",
    },
    {
      title: "Общая статистика",
      rows: [
        ["Объекты", String(dashboardStats.objects)],
        ["Номера", String(dashboardStats.rooms)],
        ["Новые заявки", String(dashboardStats.newRequests)],
      ],
      href: "/dashboard/requests",
      action: "Посмотреть заявки",
    },
  ];

  return (
    <>
      {dashboardStats.isCabinetRestricted ? (
        <section className="br-dashboard-block br-card">
          <div className="br-dashboard-block__header">
            <div>
              <h2>Продление доступа</h2>
              <p>Публичные страницы и новые заявки временно недоступны. Доступ восстановится после ручного продления подписки.</p>
            </div>
          </div>
          <div className="br-summary-card__rows">
            <div className="br-summary-card__row">
              <span>Как продлить</span>
              <strong>Свяжитесь с администратором и подтвердите оплату</strong>
            </div>
          </div>
          <div className="br-owner-actions">
            <ButtonLink href="/dashboard/subscription" variant="secondary">
              Открыть подписку
            </ButtonLink>
          </div>
        </section>
      ) : null}

      {dashboardStats.subscriptionWarningText ? (
        <div className="br-inline-notice">{dashboardStats.subscriptionWarningText}</div>
      ) : null}

      <section className="br-summary-grid">
        {summaryCards.map((card) => (
          <article key={card.title} className="br-summary-card br-card">
            <div className="br-summary-card__header">
              <strong>{card.title}</strong>
              {card.badge ? <span className="br-summary-card__badge">{card.badge}</span> : null}
            </div>
            <div className="br-summary-card__rows">
              {card.rows.map(([label, value]) => (
                <div key={label} className="br-summary-card__row">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <ButtonLink href={card.href} fullWidth>
              {card.action}
            </ButtonLink>
          </article>
        ))}
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Быстрые действия</h2>
            <p>Собрали частые сценарии владельца в одной зоне.</p>
          </div>
        </div>
        <div className="br-quick-grid">
          {quickActions.map((action) => (
            <article key={action.title} className="br-quick-card">
              <div className="br-quick-card__icon" aria-hidden="true">
                +
              </div>
              <strong>{action.title}</strong>
              <p>{action.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="br-dashboard-row">
        <section className="br-dashboard-block br-card br-dashboard-block--wide">
          <div className="br-dashboard-block__header">
            <div>
              <h2>Онбординг владельца</h2>
              <p>Пять шагов до первой рабочей витрины и приёма заявок.</p>
            </div>
            <span className="br-stepper-chip">Активный шаг: создание объекта</span>
          </div>

          <div className="br-stepper-line" aria-hidden="true">
            {onboardingSteps.map((step, index) => (
              <div key={step.title} className={`br-stepper-line__item br-stepper-line__item--${step.state}`}>
                <span>{index + 1}</span>
              </div>
            ))}
          </div>

          <div className="br-onboarding-grid">
            {onboardingSteps.map((step, index) => (
              <article key={step.title} className={`br-onboarding-card br-onboarding-card--${step.state}`}>
                <div className="br-onboarding-card__top">
                  <span className="br-onboarding-card__index">{index + 1}</span>
                  <span className="br-onboarding-card__status">{step.status}</span>
                </div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </article>
            ))}
          </div>

          <div className="br-active-step br-card">
            <div className="br-active-step__copy">
              <h3>Создайте объект размещения</h3>
              <p>Укажите основную информацию о вашем объекте. Это текущий активный шаг.</p>
            </div>
            <form className="br-form-grid">
              <div className="br-form-field">
                <label className="br-label" htmlFor="property-name">
                  Название объекта
                </label>
                <input id="property-name" className="br-field" placeholder="Например, апартаменты у моря" />
              </div>
              <div className="br-form-field">
                <label className="br-label" htmlFor="property-type">
                  Тип объекта
                </label>
                <select id="property-type" className="br-field" defaultValue="default">
                  <option value="default">Выберите тип объекта</option>
                  <option>Вилла / Дом</option>
                  <option>Апартаменты</option>
                  <option>Гостевой дом</option>
                </select>
              </div>
              <div className="br-form-field">
                <label className="br-label" htmlFor="property-address">
                  Адрес
                </label>
                <input id="property-address" className="br-field" placeholder="Введите адрес" />
              </div>
              <div className="br-form-field">
                <label className="br-label" htmlFor="property-timezone">
                  Часовой пояс
                </label>
                <select id="property-timezone" className="br-field" defaultValue="moscow">
                  <option value="moscow">(UTC+03:00) Москва</option>
                </select>
              </div>
              <div className="br-upload-tile">
                <strong>Загрузите фото объекта</strong>
                <span>JPG, PNG до 10 МБ</span>
              </div>
            </form>
            <div className="br-active-step__actions">
              <button type="button" className="br-button br-button--secondary">
                Назад
              </button>
              <button type="button" className="br-button br-button--primary">
                Продолжить
              </button>
            </div>
          </div>
        </section>

        <aside className="br-dashboard-aside">
          {emptyStates.map((state) => (
            <article key={state.title} className="br-empty-card br-card">
              <div className="br-empty-card__art" aria-hidden="true" />
              <strong>{state.title}</strong>
              <p>{state.text}</p>
              <Link href="/dashboard/properties" className="br-button br-button--primary br-button--full">
                {state.action}
              </Link>
            </article>
          ))}
        </aside>
      </section>
    </>
  );
}
