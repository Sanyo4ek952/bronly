import Link from "next/link";
import { redirect } from "next/navigation";

import { signUpAction } from "@/app/auth/actions";
import { getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { BrandLogo } from "@/shared/ui";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildLoginHref(invite: string, next: string) {
  const params = new URLSearchParams();

  if (invite) {
    params.set("invite", invite);
  }

  if (next) {
    params.set("next", next);
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const profile = await getCurrentAuthProfile();

  if (profile) {
    redirect(getPostLoginRedirect(profile.roles));
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const invite = typeof params.invite === "string" ? params.invite : "";
  const next = typeof params.next === "string" ? params.next : "";
  const requestedRole =
    typeof params.role === "string" && (params.role === "owner" || params.role === "agent")
      ? params.role
      : "owner";

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">Старт для владельца или агента</span>
            <h1 className="br-auth-shell__title">Создайте аккаунт</h1>
            <p className="br-auth-shell__text">
              Запустите свою витрину, добавьте объекты, номера и начните принимать заявки по
              персональной ссылке.
            </p>
          </div>

          <div className="br-auth-panel">
            {error ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Не удалось создать аккаунт. Проверьте поля и попробуйте еще раз.
              </p>
            ) : null}

            <form className="br-auth-form" action={signUpAction}>
              <input type="hidden" name="invite" value={invite} />
              <input type="hidden" name="next" value={next} />

              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="display-name">
                  Имя
                </label>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  className="br-field"
                  placeholder="Иван Иванов"
                  required
                />
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="role">
                  Роль
                </label>
                <select id="role" name="role" className="br-field" defaultValue={requestedRole}>
                  <option value="owner">Владелец</option>
                  <option value="agent">Агент</option>
                </select>
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="register-email">
                  Email
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  className="br-field"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="phone">
                  Телефон
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="br-field"
                  placeholder="+7 (900) 123-45-67"
                />
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="register-password">
                  Пароль
                </label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  className="br-field"
                  placeholder="Минимум 8 символов"
                  required
                />
              </div>
              <label className="br-check">
                <input name="acceptedTerms" type="checkbox" required />
                <span>
                  Я принимаю пользовательское соглашение и политику конфиденциальности.
                </span>
              </label>
              <button type="submit" className="br-button br-button--primary br-button--full">
                Зарегистрироваться
              </button>
            </form>

            <p className="br-auth-bottom">
              Уже есть аккаунт? <Link href={buildLoginHref(invite, next)}>Войти</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
