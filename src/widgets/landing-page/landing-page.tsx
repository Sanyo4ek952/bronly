import { cn } from "@/shared/lib/cn";
import { BrandLogo, ButtonLink, Panel, SectionTitle } from "@/shared/ui";
import { SiteHeader } from "@/widgets/site-header";

const container = "mx-auto w-[calc(100%-48px)] max-w-[1240px]";
const heading = "!text-[clamp(30px,3.2vw,44px)] font-medium !leading-[1.15]";

const capabilityCards = [
  { title: "Всё по одной ссылке", text: "Фото, номера, цены и удобства — на вашей персональной странице." },
  { title: "Свободные даты видны", text: "Ведите календарь занятости. Гости смогут выбрать подходящие даты." },
  { title: "Заявки приходят к вам", text: "Гость выбирает номер и оставляет запрос. Вы связываетесь с ним напрямую." },
];

const workflowSteps = [
  "Создайте объект или отдельный номер.",
  "Добавьте фото, цены и занятые даты.",
  "Отправьте гостю персональную ссылку.",
  "Получайте заявки и уточняйте доступность напрямую.",
];

const pricingCards = [
  {
    name: "Bronly",
    price: "490 ₽",
    annualPrice: "4 490 ₽/год",
    text: "Один тариф для владельцев и агентов — без скрытых уровней и автоматической смены плана.",
    features: ["30 дней бесплатно со всеми функциями", "До 15 активных номеров", "Публичная страница, календарь и заявки", "PWA и уведомления"],
    cta: "Попробовать бесплатно",
    featured: true,
  },
];

const faqItems = [
  {
    question: "Bronly подтверждает проживание?",
    answer: "Нет. Сервис не подтверждает проживание от своего имени. После заявки владелец или агент связывается с гостем и уточняет доступность.",
  },
  {
    question: "Можно ли принять оплату за проживание через Bronly?",
    answer: "Нет. Bronly не принимает оплату за проживание и не выступает стороной сделки.",
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
    <main className="min-h-screen bg-[var(--color-page)] text-[var(--color-text)] pb-[var(--safe-area-bottom)]">
      <div className={cn(container, "[&_a[href='/register']]:!text-white min-[901px]:[&_header>button]:!hidden")}><SiteHeader /></div>

      <section aria-labelledby="landing-title" className="py-10 sm:py-16 lg:pb-20">
        <div className={cn(container, "grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16")}>
          <div className="grid min-w-0 justify-items-start gap-6 lg:gap-7">
            <p className="text-[11px] font-bold tracking-[0.1em] text-[var(--color-primary-hover)] sm:text-xs">
              ДЛЯ ВЛАДЕЛЬЦЕВ ЖИЛЬЯ И АГЕНТОВ
            </p>
            <h1 id="landing-title" className="text-[clamp(40px,5vw,68px)] font-medium leading-[1.08] tracking-[-0.045em]">
              Ваше жильё.<br />Ваша ссылка.<br />Ваши гости.
            </h1>
            <p className="max-w-[520px] text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
              Соберите номера, цены и свободные даты на одной странице. Отправляйте ссылку гостям и получайте заявки напрямую.
            </p>
            <ButtonLink href="/register" className="min-h-12 px-6 !text-white">Создать свою страницу</ButtonLink>
            <p className="text-xs text-[var(--color-muted)]">30 дней бесплатно · Все функции · Работает с телефона</p>
          </div>

          <figure className="m-0 grid min-w-0 gap-4 rounded-[var(--radius-2xl)] bg-[var(--color-primary-soft)] p-4 sm:p-8">
            <p className="text-[10px] font-bold tracking-[0.08em] text-[var(--color-primary-hover)] sm:text-xs">ВАША ПЕРСОНАЛЬНАЯ СТРАНИЦА</p>
            <Panel as="div" padding="lg" className="grid min-w-0 gap-4">
              {/* Exact vector geometry from the Figma creation script, recolored with project tokens. */}
              <svg viewBox="0 0 502 210" width="502" height="210" aria-hidden="true" className="h-auto w-full overflow-hidden rounded-[var(--radius-lg)]">
                <rect width="502" height="210" fill="var(--color-surface-soft-2)" />
                <circle cx="405" cy="48" r="27" fill="var(--color-surface-soft)" />
                <path d="M0 110Q130 70 250 115T502 98V210H0Z" fill="var(--color-primary-soft)" />
                <path d="M0 150Q160 125 320 154T502 132V210H0Z" fill="var(--color-primary)" />
                <path d="M73 107L206 43L352 100V175H73Z" fill="var(--color-bg)" />
                <path d="M55 110L205 33L367 96L355 110L205 53L70 125Z" fill="var(--color-primary-hover)" />
                <path d="M243 108H335V175H243Z" fill="var(--color-border)" />
                <path d="M96 119H150V158H96ZM166 98H216V175H166ZM259 119H313V151H259Z" fill="var(--color-primary)" />
                <path d="M111 119V158M181 98V175M274 119V151" stroke="var(--color-bg)" strokeWidth="3" />
                <path d="M40 182H380L449 210H0Z" fill="var(--color-border)" />
                <path d="M313 183H466L491 205H333Z" fill="var(--color-room-ocean)" />
                <path d="M437 175V95M437 123L418 105M437 113L456 89" stroke="var(--color-primary-hover)" strokeWidth="6" />
                <circle cx="433" cy="79" r="31" fill="var(--color-primary)" />
                <circle cx="456" cy="103" r="24" fill="var(--color-primary)" />
              </svg>
              <div className="grid gap-1">
                <p className="text-2xl font-bold">Вилла у моря</p>
                <p className="text-xs leading-relaxed text-[var(--color-muted)]">Геленджик · Номера для вашего отдыха</p>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-md)] bg-[var(--color-surface-soft)] p-4">
                <div className="grid gap-1">
                  <p className="text-sm font-semibold">Двухместный с террасой</p>
                  <p className="text-xs text-[var(--color-muted)]">2 гостя · Wi-Fi · Вид на море</p>
                </div>
                <p className="text-sm font-bold text-[var(--color-primary-hover)]">от 4 500 ₽<span className="block text-xs font-normal">за сутки</span></p>
              </div>
              <span className="inline-flex min-h-12 items-center justify-center justify-self-start rounded-[var(--radius-md)] bg-[var(--accent)] px-6 text-sm font-bold text-white">Оставить заявку</span>
            </Panel>
            <figcaption className="text-[11px] leading-relaxed text-[var(--color-muted)]">Пример страницы · данные для иллюстрации</figcaption>
          </figure>
        </div>
      </section>

      <section id="capabilities" aria-labelledby="capabilities-title" className="scroll-mt-6 bg-[var(--color-surface)] py-14 sm:py-20">
        <div className={container}>
          <SectionTitle id="capabilities-title" className={heading}>Меньше переписки.<br />Больше ясности.</SectionTitle>
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {capabilityCards.map((card, index) => (
              <Panel key={card.title} as="article" surface="subtle" padding="lg" className="grid content-start gap-5 !border-0">
                <span className="text-xs font-bold text-[var(--color-primary-hover)]">0{index + 1}</span>
                <h3 className="text-xl font-semibold tracking-[-0.02em]">{card.title}</h3>
                <p className="text-[15px] leading-relaxed text-[var(--color-muted)]">{card.text}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" aria-labelledby="workflow-title" className="scroll-mt-6 py-14 sm:py-20">
        <div className={cn(container, "grid gap-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20")}>
          <div className="grid content-start gap-6">
            <SectionTitle id="workflow-title" className={heading}>От первого номера<br />до первой заявки.</SectionTitle>
            <p className="text-base leading-relaxed text-[var(--color-muted)]">Начните с того, что уже есть.<br />Управлять страницей удобно с телефона.</p>
          </div>
          <ol className="m-0 grid list-none gap-6 p-0">
            {workflowSteps.map((step, index) => (
              <li key={step} className="flex items-baseline gap-5">
                <span className="text-sm font-bold text-[var(--color-primary-hover)]" aria-hidden="true">0{index + 1}</span>
                <p className="text-base font-semibold leading-relaxed sm:text-lg">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-6 bg-[var(--color-surface-soft-2)] py-14 sm:py-20">
        <div className={container}>
          <SectionTitle id="pricing-title" className={heading}>Один тариф. Все функции.</SectionTitle>
          <p className="!mt-5 text-base leading-relaxed text-[var(--color-muted)]">До 15 активных номеров. Если нужно больше, лимит настраивает администратор.</p>
          <div className="mt-9 grid max-w-[620px] gap-6">
            {pricingCards.map((card) => (
              <Panel key={card.name} as="article" padding="lg" className="flex min-w-0 flex-col gap-6 !border-0"
                style={card.featured ? { background: "var(--color-primary-hover)", color: "var(--color-bg)" } : undefined}>
                <h3 className="text-[22px] font-semibold">{card.name}</h3>
                <p className="flex flex-wrap items-baseline gap-2 text-4xl font-medium tracking-[-0.03em]">
                  {card.price}<span className="text-sm font-normal tracking-normal">/ мес.</span>
                </p>
                <p className="text-base font-semibold">или {card.annualPrice}</p>
                <p className={cn("text-[15px] leading-relaxed", !card.featured && "text-[var(--color-muted)]")}>{card.text}</p>
                <ul className="grid gap-2 text-sm leading-relaxed">
                  {card.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <ButtonLink href="/register" variant={card.featured ? "secondary" : "primary"} className={cn("mt-auto min-h-12 self-start px-6", card.featured ? "!text-[var(--text)]" : "!text-white")}>{card.cta}</ButtonLink>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-6 bg-[var(--color-surface)] py-14 sm:py-20">
        <div className={cn(container, "grid gap-9 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-20")}>
          <SectionTitle id="faq-title" className={heading}>Несколько<br />важных ответов</SectionTitle>
          <div className="grid gap-7">
            {faqItems.map((item) => (
              <article key={item.question} className="grid gap-2">
                <h3 className="text-base font-semibold">{item.question}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted)]">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="start-title" className="bg-[var(--color-primary-hover)] py-14 text-[var(--color-bg)] sm:py-16">
        <div className={cn(container, "grid justify-items-start gap-6")}>
          <SectionTitle id="start-title" className={heading}>Ваше гостеприимство.<br />В одном месте.</SectionTitle>
          <ButtonLink href="/register" variant="secondary" className="min-h-12 px-6 !text-[var(--text)]">Создать свою страницу</ButtonLink>
          <p className="text-sm leading-relaxed">Номера, календарь занятости и заявки — с вами на телефоне.</p>
        </div>
      </section>
      <footer className={cn(container, "flex flex-col items-start justify-between gap-6 py-10 md:flex-row")}>
        <BrandLogo />
        <p className="max-w-[620px] text-xs leading-relaxed text-[var(--color-muted)]">
          Сервис персональных страниц для владельцев жилья и агентов.<br />
          Bronly не принимает оплату за проживание и не гарантирует проживание.
        </p>
      </footer>
    </main>
  );
}
