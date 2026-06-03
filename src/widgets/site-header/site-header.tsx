import Link from "next/link";

import { BrandLogo } from "@/shared/ui";

const navItems = [
  { href: "#capabilities", label: "Возможности" },
  { href: "#workflow", label: "Как это работает" },
  { href: "#pricing", label: "Тарифы" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
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
    </header>
  );
}
