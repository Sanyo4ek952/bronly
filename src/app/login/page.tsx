import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signInAction } from "@/app/auth/actions";
import { getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { createSeoMetadata } from "@/shared/lib/seo";
import { InlineNotice, Input, SubmitButton } from "@/shared/ui";
import { AuthShell } from "@/widgets/auth-shell";

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

  const errorMessage = error === "profile"
    ? "Вход выполнен, но профиль в Bronly не создан. Попробуйте войти еще раз или обратитесь в поддержку."
    : error === "session"
      ? "Вход прошел, но сессия не сохранилась. Разрешите cookies для сайта и попробуйте снова."
      : error === "email-not-confirmed"
        ? "Email еще не подтвержден. Завершите подтверждение из письма или восстановите доступ."
        : error
          ? "Не удалось войти. Проверьте email и пароль."
          : "";

  return (
    <AuthShell
      eyebrow="Вход владельца или агента"
      title="Вход в аккаунт"
      description="Вернитесь в кабинет, чтобы управлять объектами, календарем занятости и заявками."
      footer={<>Нет аккаунта? <Link href={buildRegisterHref(invite, next)}>Создать аккаунт</Link></>}
    >
            {errorMessage ? <InlineNotice tone="error">{errorMessage}</InlineNotice> : null}
            {success === "check-email" ? (
              <InlineNotice>Аккаунт создан. Если включено подтверждение email, завершите его и затем войдите.</InlineNotice>
            ) : null}
            {info === "already-confirmed" ? (
              <InlineNotice tone="soft">Этот email уже подтвержден. Войдите с паролем или восстановите доступ.</InlineNotice>
            ) : null}

            <form className="grid gap-4" action={signInAction}>
              <input type="hidden" name="next" value={next} />

              <Input id="email" name="email" type="email" label="Email" placeholder="name@example.com" defaultValue={emailHint} required />
              <Input id="password" name="password" type="password" label="Пароль" placeholder="Введите пароль" required />
              <Link href="/forgot-password" className="justify-self-end text-sm font-bold text-[var(--color-primary-hover)] underline-offset-4 hover:underline">
                Забыли пароль?
              </Link>
              <SubmitButton fullWidth pendingLabel="Вход">Войти</SubmitButton>
            </form>
    </AuthShell>
  );
}
