import type { Metadata } from "next";
import Link from "next/link";

import { forgotPasswordAction } from "@/app/auth/actions";
import { createSeoMetadata } from "@/shared/lib/seo";
import { BrandLogo, SubmitButton } from "@/shared/ui";

type ForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Восстановление доступа",
  description: "Страница восстановления пароля в Bronly.",
  path: "/forgot-password",
  index: false,
});

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">восстановление доступа</span>
            <h1 className="br-auth-shell__title">Сброс пароля</h1>
            <p className="br-auth-shell__text">Отправим ссылку для смены пароля на ваш email.</p>
          </div>

          <div className="br-auth-panel">
            {error ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Не удалось отправить письмо. Попробуйте еще раз.
              </p>
            ) : null}
            {success === "sent" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Письмо отправлено. Проверьте почту и перейдите по ссылке.
              </p>
            ) : null}

            <form className="br-auth-form" action={forgotPasswordAction}>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="email">
                  Email
                </label>
                <input id="email" name="email" type="email" className="br-field" placeholder="name@example.com" required />
              </div>
              <SubmitButton fullWidth pendingLabel="Отправка">Отправить ссылку</SubmitButton>
            </form>

            <p className="br-auth-bottom">
              Вспомнили пароль? <Link href="/login">Вернуться ко входу</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
