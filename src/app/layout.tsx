import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MainNavigation } from "@/shared/navigation/main-navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Bronly",
  description: "SaaS для управления посуточной арендой жилья",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-screen flex-col">
          <MainNavigation />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
