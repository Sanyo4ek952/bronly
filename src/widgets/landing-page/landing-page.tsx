import { Inbox, LayoutDashboard, MonitorSmartphone, Smartphone } from "lucide-react";
import Link from "next/link";

import { AppIcon, type AppIconComponent } from "@/shared/ui";
import { SiteHeader } from "@/widgets/site-header";

const capabilityCards = [
  {
    icon: MonitorSmartphone,
    title: "Персональная страница",
    text: "Покажите объект, номера, цены и удобства по одной ссылке без общего каталога и без конкурентов рядом.",
  },
  {
    icon: Inbox,
    title: "Заявки без посредников",
    text: "Гость оставляет запрос на проживание по конкретному номеру, а владелец или агент связывается с ним напрямую.",
  },
  {
    icon: LayoutDashboard,
    title: "Один кабинет",
    text: "Календарь занятости, заявки, подписка и управление объектами собраны в одном mobile-first интерфейсе.",
  },
  {
    icon: Smartphone,
    title: "PWA на телефоне",
    text: "Сервис работает как приложение на смартфоне: быстрый доступ, push-уведомления и удобная работа с телефона.",
  },
] satisfies Array<{ icon: AppIconComponent; title: string; text: string }>;

const workflowSteps = [
  "Создайте объект или отдельный номер.",
  "Добавьте фото, цены и занятые даты.",
  "Отправьте гостю персональную ссылку.",
  "Получайте заявки и уточняйте доступность напрямую.",
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
    text: "Для владельцев, которые регулярно работают с заявками.",
    features: ["Публичная страница", "Календарь занятости и заявки", "PWA и уведомления"],
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
  {
    question: "Bronly подтверждает проживание?",
    answer: "Нет. Сервис не подтверждает проживание от своего имени. После заявки владелец или агент связывается с гостем и уточняет доступность.",
  },
  {
    question: "Можно ли принять оплату за проживание через Bronly?",
    answer: "Нет. В MVP Bronly не принимает оплату за проживание и не выступает стороной сделки.",
  },
  {
    question: "Нужно ли устанавливать приложение из App Store или Google Play?",
    answer: "Нет. Bronly работает как PWA: страницу можно открыть в браузере и установить на главный экран телефона.",
  },
  {
    question: "Можно ли отправить гостю ссылку сразу с выбранными датами?",
    answer: "Да, публичные страницы и коллекции поддерживают фильтр по датам, гостям и комнатам, чтобы гость сразу видел релевантные варианты.",
  },
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
            <span className="br-chip">mobile-first PWA для владельцев жилья и агентов</span>
            <h1 className="br-hero__title">
              Персональная страница
              <br />
              для ваших <span className="br-hero__title-accent">номеров и заявок</span>
            </h1>
            <p className="br-hero__text">
              Bronly помогает владельцам жилья и агентам показать варианты проживания, вести календарь занятости и получать
              заявки по прямой ссылке без общего каталога.
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
                <strong>Без оплаты проживания</strong>
                <span>Сервис не принимает деньги за проживание и не обещает подтверждение от своего имени</span>
              </div>
              <div className="br-highlight">
                <strong>Быстрый запуск</strong>
                <span>Объект, номер, ссылка и первая заявка без перегруженного кабинета</span>
              </div>
              <div className="br-highlight">
                <strong>Удобно с телефона</strong>
                <span>PWA, уведомления и сценарии, рассчитанные на mobile-first работу</span>
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
                  <span>Геленджик, Набережная, 15</span>
                </div>
              </div>
              <div className="br-phone-preview__stats">
                <span>Wi-Fi</span>
                <span>2 гостя</span>
                <span>Вид на море</span>
              </div>
              <button className="br-button br-button--primary br-button--full">Оставить заявку</button>
              <p className="br-phone-preview__caption">Гость видит понятный сценарий и оставляет запрос на проживание по конкретному номеру.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="br-section">
        <div className="br-container">
          <div className="br-section-heading">
            <h2>Возможности Bronly</h2>
            <p>Стартовый набор для персональной страницы владельца или агентской витрины в рамках MVP.</p>
          </div>
          <div className="br-features">
            {capabilityCards.map((card) => (
              <article key={card.title} className="br-feature-card">
                <div className="br-feature-card__icon" aria-hidden="true">
                  <AppIcon icon={card.icon} />
                </div>
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
                <p>Фокус на простом сценарии: объект, номер, ссылка, заявка и календарь занятости.</p>
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
                <strong>Кабинет владельца</strong>
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
                  <strong>bronly.app/p/ivanov-villa</strong>
                </div>
                <div>
                  <span>Статус</span>
                  <strong>Календарь и заявки под рукой</strong>
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
            <p>Подписка на сервис без оплаты проживания и без обещаний гарантированного подтверждения.</p>
          </div>
          <div className="br-pricing-grid">
            {pricingCards.map((card) => (
              <article key={card.name} className={`br-pricing-card${card.featured ? " br-pricing-card--featured" : ""}`}>
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
            <p>Ответы соответствуют границам MVP: Bronly помогает получать заявки, но не заменяет прямое общение с гостем.</p>
          </div>
          <div className="br-faq-list">
            {faqItems.map((item) => (
              <article key={item.question} className="br-faq-item">
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
