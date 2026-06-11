import Link from "next/link";

import { getReferralInvitePageData } from "@/entities/referral";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const data = await getReferralInvitePageData(token);

  if (!data.invite) {
    return (
      <main className="br-auth-page">
        <section className="br-auth-shell br-card">
          <div className="br-auth-shell__grid">
            <div className="br-auth-shell__intro">
              <span className="br-chip">приглашение недоступно</span>
              <h1 className="br-auth-shell__title">Ссылка больше не работает</h1>
              <p className="br-auth-shell__text">Попросите отправить новое приглашение из кабинета.</p>
            </div>
            <div className="br-auth-panel">
              <Link href="/register" className="br-button br-button--primary br-button--full">
                Создать аккаунт
              </Link>
            </div>
          </div>
        </section>
      </main>
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

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">персональное приглашение</span>
            <h1 className="br-auth-shell__title">
              {data.invite.inviterRole === "owner" ? "Владелец приглашает агента" : "Агент приглашает владельца"}
            </h1>
            <p className="br-auth-shell__text">{data.invite.inviterName} отправил вам приглашение в Bronly.</p>
          </div>

          <div className="br-auth-panel">
            <div className="br-auth-form">
              <div className="br-auth-form__field">
                <strong>Что будет дальше</strong>
                <p>
                  {data.invite.inviteeRole === "agent"
                    ? "После регистрации вы сможете перейти к объектам для сотрудничества и отправить предложение владельцу."
                    : "После регистрации вы сможете настроить кабинет владельца и добавить первый объект или отдельный номер."}
                </p>
              </div>

              {data.canRegister ? (
                <>
                  <Link href={registerHref} className="br-button br-button--primary br-button--full">
                    Зарегистрироваться
                  </Link>
                  <Link href={loginHref} className="br-button br-button--secondary br-button--full">
                    У меня уже есть аккаунт
                  </Link>
                </>
              ) : (
                <Link href={data.targetHref} className="br-button br-button--primary br-button--full">
                  {data.targetLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
