import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { RegisterServiceWorker } from "@/features/pwa/register-service-worker";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans",
});

const appDescription =
  "Bronly — сервис персональных страниц для владельцев жилья с номерами, ценами, календарём занятости и заявками.";

export const metadata: Metadata = {
  title: "Bronly",
  description: appDescription,
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
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
