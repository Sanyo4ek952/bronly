import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Manrope } from "next/font/google";

import { RegisterServiceWorker } from "@/features/pwa/register-service-worker";
import { createRobots, getSeoBaseUrl } from "@/shared/lib/seo";
import { TopLoadingBar } from "@/shared/ui/top-loading-bar";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans",
});

const appDescription =
  "Bronly — сервис персональных страниц для владельцев жилья и агентов: номера, цены, календарь занятости и заявки по прямой ссылке.";

export const metadata: Metadata = {
  metadataBase: getSeoBaseUrl(),
  title: {
    default: "Bronly",
    template: "%s | Bronly",
  },
  description: appDescription,
  alternates: {
    canonical: "/",
  },
  robots: createRobots(true),
  openGraph: {
    title: "Bronly",
    description: appDescription,
    url: "/",
    siteName: "Bronly",
    locale: "ru_RU",
    type: "website",
    images: [{ url: "/icon" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bronly",
    description: appDescription,
    images: ["/icon"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bronly",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#079a91",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={manrope.variable}>
        <Suspense fallback={null}>
          <TopLoadingBar />
        </Suspense>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
