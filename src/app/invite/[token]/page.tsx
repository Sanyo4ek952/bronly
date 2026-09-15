import type { Metadata } from "next";
import Link from "next/link";

import { getReferralInvitePageData } from "@/entities/referral";
import { createSeoMetadata } from "@/shared/lib/seo";
import { ButtonLink, InlineNotice } from "@/shared/ui";
import { AuthShell } from "@/widgets/auth-shell";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Приглашение",
  description: "Персональное приглашение в Bronly.",
  path: "/invite",
  index: false,
});

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const data = await getReferralInvitePageData(token);

  if (!data.invite) {
    return (
      <AuthShell
        eyebrow="Приглашение недоступно"
        title="Ссылка больше не работает"
        description="Попросите отправить новое персональное приглашение из кабинета Bronly."
        footer={<Link href="/login">Уже есть аккаунт? Войти</Link>}
      >
        <InlineNotice tone="warning">Приглашение могло быть использовано, отозвано или просрочено.</InlineNotice>
        <ButtonLink href="/register" fullWidth>
          Создать аккаунт без приглашения
        </ButtonLink>
      </AuthShell>
    );
  }

  const registerHref = `/register?${new URLSearchParams({
    role: data.invite.inviteeRole,
    invite: data.invite.token,
    next: `/invite/${data.invite.token}`,
  }).toString()}`;
  const loginHref = `/login?${new URLSearchParams({
    invite: data.invite.token,
    next: `/invite/${data.invite.token}`,
  }).toString()}`;
  const roleLabel = data.invite.inviteeRole === "agent" ? "агента" : "владельца";

  return (
    <AuthShell
      eyebrow="Персональное приглашение"
      title={`${data.invite.inviterName} приглашает вас в Bronly`}
      description={`После регистрации вы сможете начать работу в роли ${roleLabel}. Ожидаемая роль сохранена в приглашении.`}
      footer={<Link href="/">На главную Bronly</Link>}
    >
      <div className="grid gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
        <strong className="text-base text-[var(--text)]">{data.invite.title}</strong>
        <p className="text-sm leading-[1.55] text-[var(--text-muted)]">{data.invite.nextStepText}</p>
      </div>

      {data.canRegister ? (
        <div className="grid gap-3">
          <ButtonLink href={registerHref} fullWidth>
            Зарегистрироваться
          </ButtonLink>
          <ButtonLink href={loginHref} variant="secondary" fullWidth>
            У меня уже есть аккаунт
          </ButtonLink>
        </div>
      ) : (
        <ButtonLink href={data.targetHref} fullWidth>
          {data.targetLabel}
        </ButtonLink>
      )}
    </AuthShell>
  );
}
