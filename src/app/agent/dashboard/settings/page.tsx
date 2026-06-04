import Link from "next/link";
import { redirect } from "next/navigation";

import { startTelegramNotificationLinkAction, updateProfileAction } from "@/app/auth/actions";
import { getMyTelegramNotificationStatus } from "@/entities/notification";
import { InstallAppCard } from "@/features/pwa/install-app";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildAgentPublicPath } from "@/shared/lib/public-links";
import { TelegramNotificationsCard } from "@/widgets/telegram-notifications-card";

type AgentSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getErrorMessage(error: string) {
  if (error === "telegram-not-configured") {
    return "Telegram-бот еще не настроен.";
  }

  if (error === "telegram-link") {
    return "Не удалось создать ссылку для привязки Telegram.";
  }

  if (error) {
    return "Не удалось сохранить изменения.";
  }

  return "";
}

export default async function AgentSettingsPage({ searchParams }: AgentSettingsPageProps) {
  const [profile, telegramStatus] = await Promise.all([getCurrentAuthProfile(), getMyTelegramNotificationStatus()]);

  if (!profile) {
    redirect("/login");
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  const publicAgentPath = buildAgentPublicPath(profile.agentPublicId);

  return (
    <section className="br-requests-layout">
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Профиль агента</h2>
            <p>Контакты, которые гость видит по агентской ссылке.</p>
          </div>
        </div>
        {getErrorMessage(error) ? <p className="br-card" style={{ marginBottom: 16 }}>{getErrorMessage(error)}</p> : null}
        {success === "saved" ? <p className="br-card" style={{ marginBottom: 16 }}>Профиль обновлен.</p> : null}
        <form action={updateProfileAction}>
          <input type="hidden" name="role" value="agent" />
          <div className="br-settings-grid">
            <div className="br-form-field">
              <label className="br-label" htmlFor="display-name">Имя</label>
              <input id="display-name" name="displayName" className="br-field" defaultValue={profile.displayName} />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="phone">Телефон</label>
              <input id="phone" name="phone" className="br-field" defaultValue={profile.phone} />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="email">Email</label>
              <input id="email" className="br-field" defaultValue={profile.email} disabled />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="telegram">Telegram</label>
              <input id="telegram" name="telegram" className="br-field" defaultValue={profile.telegram} />
            </div>
            <div className="br-form-field">
              <span className="br-label">Публичная ссылка</span>
              {publicAgentPath ? (
                <Link href={publicAgentPath} className="br-field" style={{ display: "block", textDecoration: "none" }}>
                  {publicAgentPath}
                </Link>
              ) : (
                <div className="br-field">Ссылка генерируется автоматически.</div>
              )}
            </div>
          </div>
          <div className="br-active-step__actions">
            <Link href="/forgot-password" className="br-button br-button--secondary">Изменить пароль</Link>
            <button className="br-button br-button--primary" type="submit">Сохранить</button>
          </div>
        </form>
      </section>

      <aside>
        <TelegramNotificationsCard role="agent" status={telegramStatus} action={startTelegramNotificationLinkAction} />
        <div style={{ height: 16 }} />
        <section className="br-dashboard-block br-card">
          <div className="br-dashboard-block__header">
            <div>
              <h2>Установка на главный экран</h2>
              <p>Быстрый доступ к Bronly с телефона без App Store и Google Play.</p>
            </div>
          </div>
          <InstallAppCard />
        </section>
      </aside>
    </section>
  );
}
