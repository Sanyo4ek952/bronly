"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AppIcon, BottomSheet, BrandLogo, IconButton } from "@/shared/ui";

const navItems = [
  { href: "#capabilities", label: "Возможности" },
  { href: "#workflow", label: "Как это работает" },
  { href: "#pricing", label: "Тарифы" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="br-header">
      <BrandLogo />

      <nav className="br-nav" aria-label="Основная навигация">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="br-header__actions">
        <Link href="/login" className="br-login-link">
          Войти
        </Link>
        <Link href="/register" className="br-button br-button--primary">
          Попробовать бесплатно
        </Link>
      </div>

      <IconButton
        type="button"
        className="br-header__menu-toggle"
        aria-label="Открыть меню"
        aria-expanded={isMobileMenuOpen}
        aria-controls="br-site-mobile-menu"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <AppIcon icon={Menu} aria-hidden="true" />
      </IconButton>

      <BottomSheet
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        dialogId="br-site-mobile-menu"
        titleId="br-site-mobile-menu-title"
        title="Меню"
        description="Быстрый доступ к разделам и входу в Bronly."
        closeLabel="Закрыть меню"
        className="br-header-mobile-sheet"
      >
        {({ close }) => (
          <>
            <nav className="br-header-mobile-sheet__nav" aria-label="Основная навигация">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="br-header-mobile-sheet__link"
                  onClick={close}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="br-header-mobile-sheet__actions">
              <Link href="/login" className="br-button br-button--secondary br-button--full" onClick={close}>
                Войти
              </Link>
              <Link
                href="/register"
                className="br-button br-button--primary br-button--full"
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
