import type { Metadata } from "next";
import { resendConfirmationEmailAction } from "@/app/auth/actions";
import { getAuthUserEmailStatus } from "@/shared/api/supabase";
import { createSeoMetadata } from "@/shared/lib/seo";
import { ButtonLink, InlineNotice, SubmitButton } from "@/shared/ui";
import { AuthShell } from "@/widgets/auth-shell";

type CheckEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Подтверждение email",
  description: "Страница подтверждения email в Bronly.",
  path: "/check-email",
  index: false,
});

function buildLoginHref(email: string, invite: string) {
  const params = new URLSearchParams({
    info: "already-confirmed",
    email,
  });

  if (invite) {
    params.set("invite", invite);
    params.set("next", `/invite/${invite}`);
  }

  return `/login?${params.toString()}`;
}

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const email = typeof params.email === "string" ? params.email : "";
  const role = typeof params.role === "string" ? params.role : "owner";
  const invite = typeof params.invite === "string" ? params.invite : "";
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  const roleLabel = role === "agent" ? "агента" : "владельца";
  const emailStatus = email ? await getAuthUserEmailStatus(email) : "not_found";

  if (emailStatus === "confirmed") {
    const loginHref = buildLoginHref(email, invite);

    return (
      <AuthShell
        eyebrow="Email уже подтвержден"
        title="Можно войти"
        description={`Аккаунт ${email} уже зарегистрирован и подтвержден. Войдите с паролем или восстановите доступ.`}
        footer="После входа вы вернетесь к настройке витрины."
      >
        <div className="grid gap-3">
          <ButtonLink href={loginHref} fullWidth>Войти в аккаунт</ButtonLink>
          <ButtonLink href="/forgot-password" variant="secondary" fullWidth>Забыли пароль?</ButtonLink>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Подтвердите email"
      title="Почти готово"
      description={`Мы создали аккаунт ${roleLabel}. Подтвердите email${email ? ` ${email}` : ""}, чтобы завершить вход в Bronly.`}
      footer="После подтверждения откройте вход и продолжите настройку кабинета."
    >
            {error === "resend" ? (
              <InlineNotice tone="error">Не удалось отправить письмо повторно. Попробуйте позже.</InlineNotice>
            ) : null}
            {success === "sent" ? (
              <InlineNotice>Письмо отправлено. Проверьте входящие и папку «Спам».</InlineNotice>
            ) : null}

            <div className="grid gap-3">
              {["Откройте письмо с подтверждением.", "Перейдите по ссылке из письма.", "Войдите в кабинет Bronly."].map((step, index) => (
                <div key={step} className="grid grid-cols-[30px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
                  <span className="grid size-[30px] place-items-center rounded-full bg-[var(--color-primary-pale)] text-xs font-bold text-[var(--color-primary-hover)]">{index + 1}</span>
                  <strong className="text-sm leading-[1.45] text-[var(--text)]">{step}</strong>
                </div>
              ))}

              {email ? (
                <form action={resendConfirmationEmailAction}>
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="role" value={role} />
                  <input type="hidden" name="invite" value={invite} />
                  <SubmitButton variant="secondary" pendingLabel="Отправка" fullWidth>Отправить письмо еще раз</SubmitButton>
                </form>
              ) : null}

              <ButtonLink
                href={invite ? `/login?${new URLSearchParams({ invite, next: `/invite/${invite}` }).toString()}` : "/login"}
                fullWidth
              >
                Перейти ко входу
              </ButtonLink>
            </div>
    </AuthShell>
  );
}
