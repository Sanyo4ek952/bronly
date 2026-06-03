import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAuthProfile, getPostLoginRedirect, getPrimaryRole } from "@/shared/api/supabase";
import { BrandLogo } from "@/shared/ui";

type WelcomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const ownerSteps = [
  "Добавьте объект размещения.",
  "Создайте номера и базовые цены.",
  "Откройте публичную ссылку и начните принимать заявки.",
];

const agentSteps = [
  "Заполните профиль агента.",
  "Подключите объекты с активным сотрудничеством.",
  "Соберите витрину и принимайте заявки по своей ссылке.",
];

const adminSteps = [
  "Проверьте роли и профили пользователей.",
  "Настройте подписки и лимиты по owner и agent.",
  "Управляйте заморозкой объектов и доступом к публичным страницам.",
];

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const requestedRole = typeof params.role === "string" ? params.role : "";
  const primaryRole = getPrimaryRole(profile.roles);
  const steps =
    primaryRole === "admin"
      ? adminSteps
      : primaryRole === "agent"
        ? agentSteps
        : ownerSteps;
  const nextHref = getPostLoginRedirect(profile.roles);
  const title =
    primaryRole === "admin"
      ? "Админ-панель готова"
      : primaryRole === "agent"
        ? "Кабинет агента готов"
        : "Кабинет владельца готов";
  const subtitle =
    primaryRole === "admin"
      ? "Осталось проверить пользователей, подписки и доступность объектов."
      : primaryRole === "agent"
        ? "Осталось подключить объекты и собрать свою витрину."
        : "Осталось добавить объект и открыть первую публичную ссылку.";

  if (requestedRole && requestedRole !== primaryRole) {
    redirect("/welcome");
  }

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">первый вход</span>
            <h1 className="br-auth-shell__title">{title}</h1>
            <p className="br-auth-shell__text">{subtitle}</p>
          </div>

          <div className="br-auth-panel">
            <div className="br-auth-form">
              {steps.map((step, index) => (
                <div key={step} className="br-auth-form__field">
                  <strong>{index + 1}. {step}</strong>
                </div>
              ))}
              <Link href={nextHref} className="br-button br-button--primary br-button--full">
                Перейти в кабинет
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
