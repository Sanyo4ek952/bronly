"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AppIcon, BottomSheet, BrandLogo, ButtonLink, IconButton } from "@/shared/ui";

const navItems = [
  { href: "#capabilities", label: "Возможности" },
  { href: "#workflow", label: "Как это работает" },
  { href: "#pricing", label: "Тарифы" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between gap-6 py-5 max-[640px]:py-4">
      <BrandLogo />

      <nav className="flex items-center gap-5 text-sm font-semibold text-[var(--color-text)] max-[900px]:hidden" aria-label="Основная навигация">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} className="transition-colors hover:text-[var(--color-primary)]">
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3.5 max-[900px]:hidden">
        <Link href="/login" className="text-sm font-semibold text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)]">
          Войти
        </Link>
        <ButtonLink href="/register">
          Попробовать бесплатно
        </ButtonLink>
      </div>

      <IconButton
        type="button"
        className="hidden shrink-0 max-[900px]:grid"
        aria-label="Открыть меню"
        aria-expanded={isMobileMenuOpen}
        aria-controls="site-mobile-menu"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <AppIcon icon={Menu} aria-hidden="true" />
      </IconButton>

      <BottomSheet
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        dialogId="site-mobile-menu"
        titleId="site-mobile-menu-title"
        title="Меню"
        description="Быстрый доступ к разделам и входу в Bronly."
        closeLabel="Закрыть меню"
        className="gap-[18px]"
      >
        {({ close }) => (
          <>
            <nav className="grid gap-2.5" aria-label="Основная навигация">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-[52px] items-center rounded-2xl px-3.5 text-[15px] font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-primary-pale)] hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]"
                  onClick={close}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="grid gap-2.5">
              <Link
                href="/login"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 text-[13px] font-bold transition hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]"
                onClick={close}
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-4 text-[13px] font-bold text-white transition hover:-translate-y-px hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]"
                onClick={close}
              >
                Попробовать бесплатно
              </Link>
            </div>
          </>
        )}
      </BottomSheet>
    </header>
  );
}
