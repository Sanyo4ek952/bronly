import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentAuthProfile, getPostLoginRedirect, getPrimaryRole } from "@/shared/api/supabase";
import { createSeoMetadata } from "@/shared/lib/seo";
import { ButtonLink } from "@/shared/ui";
import { AuthShell } from "@/widgets/auth-shell";

type WelcomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Первый вход",
  description: "Служебная страница первого входа в Bronly.",
  path: "/welcome",
  index: false,
});

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
    <AuthShell eyebrow="Первый вход" title={title} description={subtitle} footer="Следующие шаги всегда доступны в чеклисте кабинета.">
            <div className="grid gap-3">
              {steps.map((step, index) => (
                <div key={step} className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
                  <span className="grid size-8 place-items-center rounded-full bg-[var(--color-primary-pale)] text-xs font-bold text-[var(--color-primary-hover)]">{index + 1}</span>
                  <strong className="pt-1.5 text-sm leading-[1.45] text-[var(--text)]">{step}</strong>
                </div>
              ))}
              <ButtonLink href={nextHref} fullWidth>Перейти в кабинет</ButtonLink>
            </div>
    </AuthShell>
  );
}
