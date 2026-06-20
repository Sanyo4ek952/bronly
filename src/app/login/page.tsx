import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signInAction } from "@/app/auth/actions";
import { getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { createSeoMetadata } from "@/shared/lib/seo";
import { BrandLogo } from "@/shared/ui";

export const metadata: Metadata = createSeoMetadata({
  title: "Вход",
  description: "Страница входа в Bronly.",
  path: "/login",
  index: false,
});

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildRegisterHref(invite: string, next: string) {
  const params = new URLSearchParams();

  if (invite) {
    params.set("invite", invite);
    params.set("role", "owner");
  }

  if (next) {
    params.set("next", next);
  }

  const query = params.toString();
  return query ? `/register?${query}` : "/register";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const profile = await getCurrentAuthProfile();

  if (profile) {
    redirect(getPostLoginRedirect(profile.roles));
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  const info = typeof params.info === "string" ? params.info : "";
  const emailHint = typeof params.email === "string" ? params.email : "";
  const next = typeof params.next === "string" ? params.next : "";
  const invite = typeof params.invite === "string" ? params.invite : "";

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">Вход владельца или агента</span>
            <h1 className="br-auth-shell__title">Вход в аккаунт</h1>
            <p className="br-auth-shell__text">
              Вернитесь в кабинет, чтобы управлять объектами, календарем занятости и заявками.
            </p>
          </div>

          <div className="br-auth-panel">
            {error === "profile" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Вход выполнен, но профиль в Bronly не создан. Попробуйте войти еще раз или обратитесь в
                поддержку.
              </p>
            ) : null}
            {error === "session" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Вход прошел, но сессия не сохранилась. Отключите блокировку cookies для localhost и
                попробуйте снова.
              </p>
            ) : null}
            {error === "email-not-confirmed" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Email РµС‰Рµ РЅРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅ. Р—Р°РІРµСЂС€РёС‚Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РёР· РїРёСЃСЊРјР° РёР»Рё РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚Рµ РґРѕСЃС‚СѓРї С‡РµСЂРµР· В«Р—Р°Р±С‹Р»Рё РїР°СЂРѕР»СЊ?В».
              </p>
            ) : null}
            {error && error !== "profile" && error !== "session" && error !== "email-not-confirmed" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Не удалось войти. Проверьте email и пароль.
              </p>
            ) : null}
            {success === "check-email" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Аккаунт создан. Если в проекте включено подтверждение email, завершите его и затем
                войдите.
              </p>
            ) : null}
            {info === "already-confirmed" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Этот email уже подтвержден. Войдите с паролем или восстановите его через «Забыли пароль?».
              </p>
            ) : null}

            <form className="br-auth-form" action={signInAction}>
              <input type="hidden" name="next" value={next} />

              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="br-field"
                  placeholder="name@example.com"
                  defaultValue={emailHint}
                  required
                />
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="password">
                  Пароль
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="br-field"
                  placeholder="Введите пароль"
                  required
                />
              </div>
              <Link href="/forgot-password" className="br-auth-form__forgot">
                Забыли пароль?
              </Link>
              <button type="submit" className="br-button br-button--primary br-button--full">
                Войти
              </button>
            </form>

            <p className="br-auth-bottom">
              Нет аккаунта? <Link href={buildRegisterHref(invite, next)}>Создать аккаунт</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
