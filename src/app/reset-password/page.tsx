import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { updatePasswordAction } from "@/app/auth/actions";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { createSeoMetadata } from "@/shared/lib/seo";
import { BrandLogo } from "@/shared/ui";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Новый пароль",
  description: "Страница обновления пароля в Bronly.",
  path: "/reset-password",
  index: false,
});

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">обновление пароля</span>
            <h1 className="br-auth-shell__title">Новый пароль</h1>
            <p className="br-auth-shell__text">
              Задайте новый пароль для аккаунта Bronly.
            </p>
          </div>

          <div className="br-auth-panel">
            {error ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Не удалось обновить пароль. Убедитесь, что пароли совпадают и содержат минимум 8 символов.
              </p>
            ) : null}

            <form className="br-auth-form" action={updatePasswordAction}>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="password">
                  Новый пароль
                </label>
                <input id="password" name="password" type="password" className="br-field" placeholder="Минимум 8 символов" required />
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="confirm-password">
                  Повторите пароль
                </label>
                <input id="confirm-password" name="confirmPassword" type="password" className="br-field" placeholder="Повторите пароль" required />
              </div>
              <button type="submit" className="br-button br-button--primary br-button--full">
                Сохранить пароль
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
