import Link from "next/link";
import { redirect } from "next/navigation";

import { signInAction } from "@/app/auth/actions";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { BrandLogo } from "@/shared/ui";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const profile = await getCurrentAuthProfile();

  if (profile) {
    redirect("/dashboard");
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  const info = typeof params.info === "string" ? params.info : "";
  const emailHint = typeof params.email === "string" ? params.email : "";

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">вход владельца или агента</span>
            <h1 className="br-auth-shell__title">Вход в аккаунт</h1>
            <p className="br-auth-shell__text">
              Вернитесь в кабинет, чтобы управлять объектами, календарем занятости и заявками.
            </p>
          </div>

          <div className="br-auth-panel">
            {error === "profile" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Вход выполнен, но профиль в Bronly не создан. Попробуйте войти еще раз или обратитесь в поддержку.
              </p>
            ) : null}
            {error === "session" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Вход прошел, но сессия не сохранилась. Отключите блокировку cookies для localhost и попробуйте снова.
              </p>
            ) : null}
            {error && error !== "profile" && error !== "session" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Не удалось войти. Проверьте email и пароль.
              </p>
            ) : null}
            {success === "check-email" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Аккаунт создан. Если в проекте включено подтверждение email, завершите его и затем войдите.
              </p>
            ) : null}
            {info === "already-confirmed" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Этот email уже подтвержден. Войдите с паролем или восстановите его через «Забыли пароль?».
              </p>
            ) : null}

            <form className="br-auth-form" action={signInAction}>
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
                <input id="password" name="password" type="password" className="br-field" placeholder="Введите пароль" required />
              </div>
              <Link href="/forgot-password" className="br-auth-form__forgot">
                Забыли пароль?
              </Link>
              <button type="submit" className="br-button br-button--primary br-button--full">
                Войти
              </button>
            </form>

            <p className="br-auth-bottom">
              Нет аккаунта? <Link href="/register">Создать аккаунт</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
