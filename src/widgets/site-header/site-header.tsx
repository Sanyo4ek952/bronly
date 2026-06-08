"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AppIcon, BrandLogo, IconButton } from "@/shared/ui";

const navItems = [
  { href: "#capabilities", label: "Возможности" },
  { href: "#workflow", label: "Как это работает" },
  { href: "#pricing", label: "Тарифы" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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

      {isMobileMenuOpen ? (
        <div className="br-header-mobile-sheet-backdrop" role="presentation" onClick={closeMobileMenu}>
          <div
            id="br-site-mobile-menu"
            className="br-header-mobile-sheet br-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="br-site-mobile-menu-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="br-header-mobile-sheet__handle" aria-hidden="true" />

            <div className="br-header-mobile-sheet__header">
              <div>
                <h2 id="br-site-mobile-menu-title">Меню</h2>
                <p>Быстрый доступ к разделам и входу в Bronly.</p>
              </div>
              <IconButton
                type="button"
                className="br-header-mobile-sheet__close"
                aria-label="Закрыть меню"
                onClick={closeMobileMenu}
              >
                <AppIcon icon={X} aria-hidden="true" />
              </IconButton>
            </div>

            <nav className="br-header-mobile-sheet__nav" aria-label="Основная навигация">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="br-header-mobile-sheet__link"
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="br-header-mobile-sheet__actions">
              <Link href="/login" className="br-button br-button--secondary br-button--full" onClick={closeMobileMenu}>
                Войти
              </Link>
              <Link
                href="/register"
                className="br-button br-button--primary br-button--full"
                onClick={closeMobileMenu}
              >
                Попробовать бесплатно
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
