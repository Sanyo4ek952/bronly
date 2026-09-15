import { Inbox, LayoutDashboard, MonitorSmartphone, Smartphone } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { AppIcon, ButtonLink, Panel, SectionSubtitle, SectionTitle, type AppIconComponent } from "@/shared/ui";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgb(var(--color-primary-rgb)_/_0.08),transparent_34%),var(--color-page)] pb-[var(--safe-area-bottom)]">
      <div className="mx-auto w-[calc(100%-40px)] max-w-[1180px] max-[640px]:w-[calc(100%-32px)]">
        <SiteHeader />
      </div>

      <section className="px-0 pb-14 pt-6 max-[640px]:pb-11 max-[640px]:pt-[18px]">
        <div className="mx-auto grid w-[calc(100%-40px)] max-w-[1180px] grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] items-center gap-14 max-[900px]:grid-cols-1 max-[640px]:w-[calc(100%-32px)] max-[640px]:gap-8">
          <div>
            <span className="inline-flex min-h-[30px] items-center gap-2.5 rounded-full bg-[var(--color-primary-soft)] px-4 py-1 text-[13px] font-bold text-[var(--color-primary-hover)] before:size-[9px] before:rounded-full before:bg-[var(--color-primary)] before:content-['']">mobile-first PWA для владельцев жилья и агентов</span>
            <h1 className="mt-[26px] max-w-[650px] text-[clamp(42px,5vw,68px)] font-extrabold leading-[1.04] max-[640px]:text-[clamp(36px,12vw,52px)]">
              Персональная страница
              <br />
              для ваших <span className="text-[var(--color-primary-hover)]">номеров и заявок</span>
            </h1>
            <p className="mt-[26px] max-w-[590px] text-lg leading-[1.65] text-[var(--color-muted)] max-[640px]:text-base">
              Bronly помогает владельцам жилья и агентам показать варианты проживания, вести календарь занятости и получать
              заявки по прямой ссылке без общего каталога.
            </p>
            <div className="mt-9 flex items-center gap-[18px] max-[520px]:grid">
              <ButtonLink href="/register">
                Попробовать бесплатно
              </ButtonLink>
              <ButtonLink href="#capabilities" variant="secondary">
                Посмотреть возможности
              </ButtonLink>
            </div>

            <div className="mt-9 grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-1">
              <div className="grid gap-1.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.72)] px-[18px] py-4 shadow-[var(--shadow-sm)]">
                <strong>Без оплаты проживания</strong>
                <span className="text-[13px] leading-[1.5] text-[var(--color-muted)]">Сервис не принимает деньги за проживание и не обещает подтверждение от своего имени</span>
              </div>
              <div className="grid gap-1.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.72)] px-[18px] py-4 shadow-[var(--shadow-sm)]">
                <strong>Быстрый запуск</strong>
                <span className="text-[13px] leading-[1.5] text-[var(--color-muted)]">Объект, номер, ссылка и первая заявка без перегруженного кабинета</span>
              </div>
              <div className="grid gap-1.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.72)] px-[18px] py-4 shadow-[var(--shadow-sm)]">
                <strong>Удобно с телефона</strong>
                <span className="text-[13px] leading-[1.5] text-[var(--color-muted)]">PWA, уведомления и сценарии, рассчитанные на mobile-first работу</span>
              </div>
            </div>
          </div>

          <Panel className="relative min-h-[540px] overflow-hidden bg-[radial-gradient(circle_at_24%_18%,rgb(255_255_255_/_0.95)_0,transparent_36%),linear-gradient(180deg,#d9eef0,#f7fbfb_56%,#f0f7f6)] p-7 max-[640px]:min-h-[500px] max-[640px]:p-4" padding="none">
            <div className="absolute inset-[22px] rounded-[28px] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.10),rgb(17_29_27_/_0.04)),linear-gradient(135deg,#d0e6eb_0%,#a8d4de_28%,#8cc3d2_42%,#dae9df_62%,#c6d0bf_100%)]" />
            <div className="absolute bottom-[26px] right-11 z-[1] grid w-[min(100%,320px)] gap-[18px] rounded-[34px] border border-[#d5dfdc] bg-[rgb(255_255_255_/_0.92)] px-4 pb-5 pt-[18px] shadow-[var(--shadow-lg)] backdrop-blur-xl max-[640px]:right-1/2 max-[640px]:w-[calc(100%-56px)] max-[640px]:translate-x-1/2">
              <div className="flex justify-center gap-2">
                <span className="size-2 rounded-full bg-[#d4dcda]" />
                <span className="size-2 rounded-full bg-[#d4dcda]" />
              </div>
              <div className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg)]">
                <div className="aspect-[1.35] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.14),rgb(17_29_27_/_0.08)),linear-gradient(135deg,#b9d8df_0%,#89bdd0_38%,#d7e5d6_78%,#c8b99f_100%)]" />
                <div className="grid gap-1 p-3.5">
                  <strong className="text-lg">Вилла у моря</strong>
                  <span className="text-[13px] leading-[1.5] text-[var(--color-muted)]">Геленджик, Набережная, 15</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-[var(--color-primary-hover)] [&>span]:rounded-full [&>span]:bg-[var(--color-primary-pale)] [&>span]:px-2.5 [&>span]:py-[7px]">
                <span>Wi-Fi</span><span>2 гостя</span><span>Вид на море</span>
              </div>
              <span className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-[22px] text-sm font-bold text-white shadow-[0_10px_22px_rgb(var(--color-primary-rgb)_/_0.18)]">Оставить заявку</span>
              <p className="text-[13px] leading-[1.5] text-[var(--color-muted)]">Гость видит понятный сценарий и оставляет запрос на проживание по конкретному номеру.</p>
            </div>
          </Panel>
        </div>
      </section>

      <section id="capabilities" className="py-14 sm:py-[72px]">
        <div className="mx-auto w-[calc(100%-40px)] max-w-[1180px] max-[640px]:w-[calc(100%-32px)]">
          <div className="grid gap-3">
            <SectionTitle>Возможности Bronly</SectionTitle>
            <SectionSubtitle>Стартовый набор для персональной страницы владельца или агентской витрины в рамках MVP.</SectionSubtitle>
          </div>
          <div className="mt-[42px] grid grid-cols-4 gap-[18px] max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
            {capabilityCards.map((card) => (
              <article key={card.title} className="min-h-[148px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[22px] shadow-[var(--shadow-sm)]">
                <div className="mb-4 grid size-[34px] place-items-center rounded-[10px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]" aria-hidden="true">
                  <AppIcon icon={card.icon} className="size-[18px]" />
                </div>
                <h3 className="text-[15px] font-extrabold leading-[1.3]">{card.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-[var(--color-muted)]">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-[linear-gradient(180deg,rgb(255_255_255_/_0),rgb(255_255_255_/_0.64))] py-14 sm:py-[72px]">
        <div className="mx-auto w-[calc(100%-40px)] max-w-[1180px] max-[640px]:w-[calc(100%-32px)]">
          <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-7 max-[900px]:grid-cols-1">
            <div>
              <div className="grid gap-3">
                <SectionTitle>Как это работает</SectionTitle>
                <SectionSubtitle>Фокус на простом сценарии: объект, номер, ссылка, заявка и календарь занятости.</SectionSubtitle>
              </div>
              <div className="mt-7 grid gap-4">
                {workflowSteps.map((step, index) => (
                  <div key={step} className="grid grid-cols-[52px_1fr] items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[18px]">
                    <div className="grid size-[52px] place-items-center rounded-2xl bg-[var(--color-primary-soft)] font-extrabold text-[var(--color-primary-hover)]">{index + 1}</div>
                    <p className="text-[15px] leading-[1.55]">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <Panel as="aside" className="p-6" padding="none">
              <div className="grid gap-2">
                <strong>Кабинет владельца</strong>
                <span className="text-[13px] text-[var(--color-muted)]">Обзор за 30 дней</span>
              </div>
              <div className="mt-[22px] grid grid-cols-3 gap-3">
                <div className="grid gap-1.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-soft)] px-4 py-[18px]">
                  <strong className="text-2xl">2</strong>
                  <span className="text-[13px] text-[var(--color-muted)]">объекта</span>
                </div>
                <div className="grid gap-1.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-soft)] px-4 py-[18px]">
                  <strong className="text-2xl">7</strong>
                  <span className="text-[13px] text-[var(--color-muted)]">номеров</span>
                </div>
                <div className="grid gap-1.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-soft)] px-4 py-[18px]">
                  <strong className="text-2xl">18</strong>
                  <span className="text-[13px] text-[var(--color-muted)]">новых заявок</span>
                </div>
              </div>
              <div className="mt-[22px] grid gap-2 [&>div]:grid [&>div]:gap-1 [&>div]:border-t [&>div]:border-[var(--color-border)] [&>div]:py-3.5 [&_span]:text-[13px] [&_span]:text-[var(--color-muted)]">
                <div><span>Публичная ссылка</span>
                  <strong>bronly.app/p/ivanov-villa</strong>
                </div>
                <div>
                  <span>Статус</span>
                  <strong>Календарь и заявки под рукой</strong>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-14 sm:py-[72px]">
        <div className="mx-auto w-[calc(100%-40px)] max-w-[1180px] max-[640px]:w-[calc(100%-32px)]">
          <div className="grid gap-3">
            <SectionTitle>Простые тарифы</SectionTitle>
            <SectionSubtitle>Подписка на сервис без оплаты проживания и без обещаний гарантированного подтверждения.</SectionSubtitle>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-1">
            {pricingCards.map((card) => (
              <article key={card.name} className={cn("relative grid gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[26px] shadow-[var(--shadow-sm)]", card.featured && "border-[rgb(var(--color-primary-rgb)_/_0.25)] shadow-[0_18px_34px_rgb(var(--color-primary-rgb)_/_0.12)]")}>
                {card.featured ? <span className="absolute -top-3 left-6 rounded-full bg-[#ffd7a1] px-2.5 py-1.5 text-xs font-bold text-[#85501a]">Популярный</span> : null}
                <h3 className="text-[22px]">{card.name}</h3>
                <div className="flex items-baseline gap-1.5 text-[40px] font-extrabold">
                  {card.price}
                  <span className="text-[15px] font-semibold text-[var(--color-muted)]">/ мес.</span>
                </div>
                <p className="leading-[1.6] text-[var(--color-muted)]">{card.text}</p>
                <ul className="grid gap-2.5">
                  {card.features.map((feature) => (
                    <li key={feature} className="relative pl-5 text-sm leading-[1.6] text-[var(--color-muted)] before:absolute before:left-0 before:top-2 before:size-2 before:rounded-full before:bg-[var(--color-primary)]">{feature}</li>
                  ))}
                </ul>
                <ButtonLink href="/register" fullWidth>
                  {card.cta}
                </ButtonLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[linear-gradient(180deg,rgb(255_255_255_/_0),rgb(255_255_255_/_0.64))] py-14 sm:py-[72px]">
        <div className="mx-auto w-[calc(100%-40px)] max-w-[1180px] max-[640px]:w-[calc(100%-32px)]">
          <div className="grid gap-3">
            <SectionTitle>Частые вопросы</SectionTitle>
            <SectionSubtitle>Ответы соответствуют границам MVP: Bronly помогает получать заявки, но не заменяет прямое общение с гостем.</SectionSubtitle>
          </div>
          <div className="mt-[34px] grid gap-3.5">
            {faqItems.map((item) => (
              <article key={item.question} className="grid gap-2.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[22px] py-5">
                <strong className="text-base">{item.question}</strong>
                <p className="text-sm leading-[1.6] text-[var(--color-muted)]">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
