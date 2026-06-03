import Link from "next/link";

import { resendConfirmationEmailAction } from "@/app/auth/actions";
import { getAuthUserEmailStatus } from "@/shared/api/supabase";
import { BrandLogo } from "@/shared/ui";

type CheckEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const email = typeof params.email === "string" ? params.email : "";
  const role = typeof params.role === "string" ? params.role : "owner";
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  const roleLabel = role === "agent" ? "агента" : "владельца";
  const emailStatus = email ? await getAuthUserEmailStatus(email) : "not_found";

  if (emailStatus === "confirmed") {
    const loginHref = `/login?info=already-confirmed&email=${encodeURIComponent(email)}`;

    return (
      <main className="br-auth-page">
        <section className="br-auth-shell br-card">
          <BrandLogo className="br-auth-shell__logo" />
          <div className="br-auth-shell__grid">
            <div className="br-auth-shell__intro">
              <span className="br-chip">email уже подтвержден</span>
              <h1 className="br-auth-shell__title">Можно войти</h1>
              <p className="br-auth-shell__text">
                Аккаунт {email} уже зарегистрирован и подтвержден в Supabase. Новое письмо для этого email не
                отправляется — войдите с паролем или восстановите доступ.
              </p>
            </div>

            <div className="br-auth-panel">
              <div className="br-auth-form">
                <Link href={loginHref} className="br-button br-button--primary br-button--full">
                  Войти в аккаунт
                </Link>
                <Link href="/forgot-password" className="br-button br-button--secondary br-button--full">
                  Забыли пароль?
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">подтвердите email</span>
            <h1 className="br-auth-shell__title">Почти готово</h1>
            <p className="br-auth-shell__text">
              Мы создали аккаунт {roleLabel}. Подтвердите email{email ? ` ${email}` : ""}, чтобы завершить вход в
              Bronly.
            </p>
          </div>

          <div className="br-auth-panel">
            {error === "resend" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Не удалось отправить письмо повторно. Попробуйте позже или проверьте настройки SMTP в Supabase.
              </p>
            ) : null}
            {success === "sent" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Запрос отправлен. Проверьте входящие и папку «Спам» (отправитель — Supabase Auth).
              </p>
            ) : null}

            <div className="br-auth-form">
              <div className="br-auth-form__field">
                <strong>1. Откройте письмо от Supabase (тема вроде «Confirm your signup»).</strong>
              </div>
              <div className="br-auth-form__field">
                <strong>2. Перейдите по ссылке подтверждения.</strong>
              </div>
              <div className="br-auth-form__field">
                <strong>3. После этого войдите в кабинет Bronly.</strong>
              </div>

              {email ? (
                <form className="br-auth-form" action={resendConfirmationEmailAction}>
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="role" value={role} />
                  <button type="submit" className="br-button br-button--secondary br-button--full">
                    Отправить письмо еще раз
                  </button>
                </form>
              ) : null}

              <Link href="/login" className="br-button br-button--primary br-button--full">
                Перейти ко входу
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
