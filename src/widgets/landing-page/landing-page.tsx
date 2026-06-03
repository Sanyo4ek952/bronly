import Link from "next/link";

import { SiteHeader } from "@/widgets/site-header";

const capabilityCards = [
  {
    title: "Персональная страница",
    text: "Покажите объект, номера, цены и удобства в одной чистой витрине без конкурентов.",
  },
  {
    title: "Заявки без посредников",
    text: "Гость оставляет запрос на конкретный номер, а владелец связывается с ним напрямую.",
  },
  {
    title: "Один кабинет",
    text: "Календарь занятости, заявки, подписка и управление объектами собраны в одном месте.",
  },
  {
    title: "PWA на телефоне",
    text: "Сервис работает как мобильное приложение с быстрым доступом и push-уведомлениями.",
  },
];

const workflowSteps = [
  "Создайте объект и добавьте номера.",
  "Заполните цены, фото и правила проживания.",
  "Получите публичную ссылку и отправьте ее гостю.",
  "Получайте заявки и ведите календарь занятости.",
];

const pricingCards = [
  {
    name: "Старт",
    price: "0 ₽",
    text: "Для первого запуска и проверки сценария.",
    features: ["1 объект", "До 5 номеров в пробный период", "Базовые функции"],
    cta: "Начать бесплатно",
    featured: false,
  },
  {
    name: "Базовый",
    price: "790 ₽",
    text: "Для владельцев, которые уже работают с заявками регулярно.",
    features: ["Публичная витрина", "Календарь и заявки", "PWA и уведомления"],
    cta: "Выбрать тариф",
    featured: true,
  },
  {
    name: "Премиум",
    price: "1 490 ₽",
    text: "Для нескольких объектов и расширенного управления.",
    features: ["Все из Базового", "Расширенный лимит номеров", "Приоритетная поддержка"],
    cta: "Выбрать тариф",
    featured: false,
  },
];

const faqItems = [
  "Bronly подтверждает проживание?",
  "Можно ли принимать оплату проживания через сервис?",
  "Нужно ли ставить приложение из App Store?",
  "Можно ли отправить гостю ссылку сразу с выбранными датами?",
];

export function LandingPage() {
  return (
    <main className="br-page">
      <div className="br-container">
        <SiteHeader />
      </div>

      <section className="br-hero">
        <div className="br-container br-hero__grid">
          <div>
            <span className="br-chip">mobile-first PWA для владельцев жилья</span>
            <h1 className="br-hero__title">
              Создайте страницу
              <br />
              со своими <span className="br-hero__title-accent">номерами</span>
            </h1>
            <p className="br-hero__text">
              Bronly помогает владельцам жилья показать объект, вести календарь занятости и получать
              заявки по одной персональной ссылке.
            </p>
            <div className="br-hero__actions">
              <Link href="/register" className="br-button br-button--primary">
                Попробовать бесплатно
              </Link>
              <a href="#capabilities" className="br-button br-button--secondary">
                Посмотреть возможности
              </a>
            </div>

            <div className="br-hero__highlights">
              <div className="br-highlight">
                <strong>Без комиссий</strong>
                <span>и скрытых платежей за проживание</span>
              </div>
              <div className="br-highlight">
                <strong>Быстрый запуск</strong>
                <span>с опорой на понятные шаблоны</span>
              </div>
              <div className="br-highlight">
                <strong>На телефоне</strong>
                <span>как PWA с уведомлениями</span>
              </div>
            </div>
          </div>

          <div className="br-hero__visual br-card">
            <div className="br-hero__media" />
            <div className="br-phone-preview">
              <div className="br-phone-preview__top">
                <span className="br-phone-preview__dot" />
                <span className="br-phone-preview__dot" />
              </div>
              <div className="br-phone-preview__card">
                <div className="br-phone-preview__image" />
                <div className="br-phone-preview__content">
                  <strong>Вилла у моря</strong>
                  <span>г. Геленджик, ул. Набережная, 15</span>
                </div>
              </div>
              <div className="br-phone-preview__stats">
                <span>Wi-Fi</span>
                <span>2 гостя</span>
                <span>Вид на море</span>
              </div>
              <button className="br-button br-button--primary br-button--full">
                Оставить заявку
              </button>
              <p className="br-phone-preview__caption">
                Быстрый ответ владельца и понятный сценарий для гостя.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="br-section">
        <div className="br-container">
          <div className="br-section-heading">
            <h2>Возможности Bronly</h2>
            <p>Стартовый набор для запуска персональной витрины без перегруженного кабинета.</p>
          </div>
          <div className="br-features">
            {capabilityCards.map((card) => (
              <article key={card.title} className="br-feature-card">
                <div className="br-feature-card__icon" aria-hidden="true" />
                <h3 className="br-feature-card__title">{card.title}</h3>
                <p className="br-feature-card__text">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="br-section br-section--soft">
        <div className="br-container">
          <div className="br-split">
            <div>
              <div className="br-section-heading">
                <h2>Как это работает</h2>
                <p>Фокус на простом owner-flow: объект, номера, ссылка, заявки.</p>
              </div>
              <div className="br-step-list">
                {workflowSteps.map((step, index) => (
                  <div key={step} className="br-step">
                    <div className="br-step__index">{index + 1}</div>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="br-card br-dashboard-card">
              <div className="br-dashboard-card__header">
                <strong>Панель владельца</strong>
                <span>Обзор за 30 дней</span>
              </div>
              <div className="br-stat-grid">
                <div className="br-stat-tile">
                  <strong>2</strong>
                  <span>объекта</span>
                </div>
                <div className="br-stat-tile">
                  <strong>7</strong>
                  <span>номеров</span>
                </div>
                <div className="br-stat-tile">
                  <strong>18</strong>
                  <span>новых заявок</span>
                </div>
              </div>
              <div className="br-dashboard-card__list">
                <div>
                  <span>Публичная ссылка</span>
                  <strong>bronly.ru/u/ivanov-villa</strong>
                </div>
                <div>
                  <span>Подписка</span>
                  <strong>Активна до 24 мая 2025</strong>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="pricing" className="br-section">
        <div className="br-container">
          <div className="br-section-heading">
            <h2>Простые тарифы</h2>
            <p>Без оплаты проживания и без обещаний, которых сервис не должен давать.</p>
          </div>
          <div className="br-pricing-grid">
            {pricingCards.map((card) => (
              <article
                key={card.name}
                className={`br-pricing-card${card.featured ? " br-pricing-card--featured" : ""}`}
              >
                {card.featured ? <span className="br-pricing-card__badge">Популярный</span> : null}
                <h3>{card.name}</h3>
                <div className="br-pricing-card__price">
                  {card.price}
                  <span>/ мес.</span>
                </div>
                <p>{card.text}</p>
                <ul>
                  {card.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link href="/register" className="br-button br-button--primary br-button--full">
                  {card.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="br-section br-section--soft">
        <div className="br-container">
          <div className="br-section-heading">
            <h2>Частые вопросы</h2>
            <p>Сразу подстраиваем копирайтинг под продуктовые границы Bronly.</p>
          </div>
          <div className="br-faq-list">
            {faqItems.map((item) => (
              <article key={item} className="br-faq-item">
                <strong>{item}</strong>
                <p>
                  Ответ будет уточнен в продуктовых сценариях, но терминология и границы MVP уже
                  зафиксированы в документации проекта.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
