import Link from "next/link";

import { startTelegramNotificationLinkAction, updateProfileAction } from "@/app/auth/actions";
import { getMyTelegramNotificationStatus } from "@/entities/notification";
import { InstallAppCard } from "@/features/pwa/install-app";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildOwnerPublicPath } from "@/shared/lib";
import { SubmitButton } from "@/shared/ui";
import { TelegramNotificationsCard } from "@/widgets/telegram-notifications-card";

type SettingsPageProps = {
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

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [profile, telegramStatus] = await Promise.all([getCurrentAuthProfile(), getMyTelegramNotificationStatus()]);
  const publicOwnerPath = buildOwnerPublicPath(profile?.slug);
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";

  return (
    <section className="br-requests-layout">
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Профиль владельца</h2>
            <p>Контакты и базовые настройки кабинета.</p>
          </div>
        </div>
        {getErrorMessage(error) ? <p className="br-card" style={{ marginBottom: 16 }}>{getErrorMessage(error)}</p> : null}
        {success === "saved" ? <p className="br-card" style={{ marginBottom: 16 }}>Профиль обновлен.</p> : null}
        <div className="br-card" style={{ marginBottom: 16, padding: 16 }}>
          <strong>Публичная страница владельца</strong>
          <p style={{ marginTop: 8 }}>{publicOwnerPath ?? "Заполните slug, чтобы получить ссылку /p/[profile.slug]."}</p>
          <div className="br-active-step__actions" style={{ marginTop: 12 }}>
            <Link href={publicOwnerPath ?? "/dashboard/settings"} className="br-button br-button--secondary">
              {publicOwnerPath ? "Открыть публичную страницу" : "Заполнить slug"}
            </Link>
          </div>
        </div>
        <form action={updateProfileAction}>
          <input type="hidden" name="role" value="owner" />
          <div className="br-settings-grid">
            <div className="br-form-field">
              <label className="br-label" htmlFor="display-name">Имя</label>
              <input id="display-name" name="displayName" className="br-field" defaultValue={profile?.displayName} />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="phone">Телефон</label>
              <input id="phone" name="phone" className="br-field" defaultValue={profile?.phone} />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="email">Email</label>
              <input id="email" className="br-field" defaultValue={profile?.email} disabled />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="slug">Slug</label>
              <input id="slug" name="slug" className="br-field" defaultValue={profile?.slug} />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="telegram">Telegram</label>
              <input id="telegram" name="telegram" className="br-field" defaultValue={profile?.telegram} />
            </div>
          </div>
          <div className="br-active-step__actions">
            <Link href="/forgot-password" className="br-button br-button--secondary">Изменить пароль</Link>
            <SubmitButton pendingLabel="Сохранение">Сохранить</SubmitButton>
          </div>
        </form>
      </section>

      <aside>
        <TelegramNotificationsCard role="owner" status={telegramStatus} action={startTelegramNotificationLinkAction} />
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
