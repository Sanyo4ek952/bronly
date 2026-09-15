import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signUpAction } from "@/app/auth/actions";
import { getReferralRegistrationIntent } from "@/entities/referral";
import { getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { createSeoMetadata } from "@/shared/lib/seo";
import { InlineNotice, Input, Select, SubmitButton } from "@/shared/ui";
import { AuthShell } from "@/widgets/auth-shell";

export const metadata: Metadata = createSeoMetadata({
  title: "Регистрация",
  description: "Страница регистрации в Bronly.",
  path: "/register",
  index: false,
});

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
  const inviteIntent = invite ? await getReferralRegistrationIntent(invite) : null;
  const requestedRoleFromQuery =
    typeof params.role === "string" && (params.role === "owner" || params.role === "agent")
      ? params.role
      : "owner";
  const requestedRole = inviteIntent?.inviteeRole ?? requestedRoleFromQuery;
  const invalidInvite = Boolean(invite && !inviteIntent);

  return (
    <AuthShell
      eyebrow="Старт для владельца или агента"
      title="Создайте аккаунт"
      description="Запустите свою витрину, добавьте объекты, номера и начните принимать заявки по персональной ссылке."
      footer={<>Уже есть аккаунт? <Link href={buildLoginHref(invite, next)}>Войти</Link></>}
    >
            {error ? (
              <InlineNotice tone="error">
                {error === "invite"
                  ? "Приглашение недоступно или уже использовано. Попросите отправить новую ссылку."
                  : "Не удалось создать аккаунт. Проверьте поля и попробуйте еще раз."}
              </InlineNotice>
            ) : null}

            <form className="grid gap-4" action={signUpAction}>
              <input type="hidden" name="invite" value={invite} />
              <input type="hidden" name="next" value={next} />

              <Input id="display-name" name="displayName" type="text" label="Имя" placeholder="Иван Иванов" required />
              {inviteIntent ? (
                <>
                  <input type="hidden" name="role" value={requestedRole} />
                  <Input
                    id="role"
                    label="Роль по приглашению"
                    value={requestedRole === "agent" ? "Агент" : "Владелец"}
                    readOnly
                    description="Роль зафиксирована персональным приглашением."
                  />
                </>
              ) : (
                <Select id="role" name="role" label="Роль" defaultValue={requestedRole}>
                    <option value="owner">Владелец</option>
                    <option value="agent">Агент</option>
                </Select>
              )}
              <Input id="register-email" name="email" type="email" label="Email" placeholder="name@example.com" required />
              <Input id="phone" name="phone" type="tel" label="Телефон" placeholder="+7 (900) 123-45-67" />
              <Input id="register-password" name="password" type="password" label="Пароль" description="Минимум 8 символов." placeholder="Минимум 8 символов" minLength={8} required />
              <label className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5 text-sm leading-[1.45] text-[var(--text-muted)]">
                <input className="mt-0.5 size-[18px] shrink-0 accent-[var(--color-primary)]" name="acceptedTerms" type="checkbox" required />
                <span>Я принимаю пользовательское соглашение и политику конфиденциальности</span>
              </label>
              <SubmitButton fullWidth pendingLabel="Регистрация" disabled={invalidInvite}>Зарегистрироваться</SubmitButton>
            </form>
    </AuthShell>
  );
}
