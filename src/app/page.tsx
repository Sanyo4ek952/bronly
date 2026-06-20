import type { Metadata } from "next";

import { buildCanonicalUrl, createSeoMetadata, toJsonLd } from "@/shared/lib/seo";
import { LandingPage } from "@/widgets/landing-page";

const title = "Персональные страницы для владельцев жилья и агентов";
const description =
  "Bronly — сервис персональных страниц: номера, цены, календарь занятости и заявки по прямой ссылке без общего каталога.";

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Bronly",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Android, iOS",
  description,
  url: buildCanonicalUrl("/"),
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "RUB",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Bronly подтверждает проживание?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Нет. Сервис не подтверждает проживание от своего имени. После заявки владелец или агент связывается с гостем и уточняет доступность.",
      },
    },
    {
      "@type": "Question",
      name: "Можно ли принять оплату за проживание через Bronly?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Нет. В MVP Bronly не принимает оплату за проживание и не выступает стороной сделки.",
      },
    },
    {
      "@type": "Question",
      name: "Нужно ли устанавливать приложение из App Store или Google Play?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Нет. Bronly работает как PWA: страницу можно открыть в браузере и установить на главный экран телефона.",
      },
    },
  ],
};

export const metadata: Metadata = createSeoMetadata({
  title,
  description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(softwareApplicationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(faqJsonLd) }} />
      <LandingPage />
    </>
  );
}
