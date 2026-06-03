import type { Metadata, Viewport } from "next";

import { RegisterServiceWorker } from "@/features/pwa/register-service-worker";

import "./globals.css";

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
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
