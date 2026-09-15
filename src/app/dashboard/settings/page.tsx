import {
  setTelegramNotificationsEnabledAction,
  startTelegramNotificationLinkAction,
  updateProfileAction,
} from "@/app/auth/actions";
import { getMyTelegramNotificationStatus } from "@/entities/notification";
import { InstallAppCard } from "@/features/pwa/install-app";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildOwnerPublicPath } from "@/shared/lib";
import { ButtonLink, InlineNotice, Input, Panel, SubmitButton } from "@/shared/ui";
import { CopyLinkButton } from "@/widgets/property-admin";
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

  if (error === "telegram-setting") {
    return "Не удалось изменить настройки Telegram-уведомлений.";
  }

  if (error === "validation") {
    return "Укажите имя владельца и проверьте остальные поля.";
  }

  if (error === "subscription") {
    return "Профиль временно нельзя изменить, пока подписка не продлена.";
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
    <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Panel className="grid gap-5 p-5 max-[640px]:p-4" surface="raised">
        <div className="grid gap-1.5">
          <h1 className="text-[clamp(26px,4vw,34px)] font-bold leading-[1.05] tracking-[-0.035em] text-[var(--text)]">Профиль владельца</h1>
          <p className="text-sm leading-[1.55] text-[var(--text-muted)]">Контакты, адрес публичной страницы и базовые настройки кабинета.</p>
        </div>
        {getErrorMessage(error) ? <InlineNotice tone="error">{getErrorMessage(error)}</InlineNotice> : null}
        {success === "saved" ? <InlineNotice>Профиль обновлен.</InlineNotice> : null}
        {success === "telegram-enabled" ? <InlineNotice>Telegram-уведомления включены.</InlineNotice> : null}
        {success === "telegram-disabled" ? <InlineNotice tone="soft">Telegram-уведомления отключены.</InlineNotice> : null}

        <section className="grid gap-3 rounded-[20px] border border-[rgb(var(--color-primary-rgb)_/_0.16)] bg-[var(--color-primary-pale)] p-4">
          <div className="grid gap-1.5">
            <strong className="text-base text-[var(--text)]">Публичная страница владельца</strong>
            <p className="break-all text-sm leading-[1.5] text-[var(--text-muted)]">
              {publicOwnerPath ?? "Задайте адрес страницы ниже, чтобы получить персональную ссылку для гостей."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href={publicOwnerPath ?? "#public-slug"} variant="secondary" disabled={!publicOwnerPath}>
              Открыть страницу
            </ButtonLink>
            {publicOwnerPath ? <CopyLinkButton path={publicOwnerPath} /> : null}
          </div>
        </section>

        <form action={updateProfileAction} className="grid gap-5">
          <input type="hidden" name="role" value="owner" />
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="display-name" name="displayName" label="Имя" defaultValue={profile?.displayName} required />
            <Input id="phone" name="phone" type="tel" label="Телефон" defaultValue={profile?.phone} />
            <Input id="email" type="email" label="Email" defaultValue={profile?.email} disabled />
            <Input id="public-slug" name="slug" label="Адрес страницы" description="Используется в персональной ссылке после /p/." defaultValue={profile?.slug} />
            <Input id="telegram" name="telegram" label="Telegram" placeholder="@username" defaultValue={profile?.telegram} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ButtonLink href="/forgot-password" variant="secondary" fullWidth>Изменить пароль</ButtonLink>
            <SubmitButton pendingLabel="Сохранение">Сохранить</SubmitButton>
          </div>
        </form>
      </Panel>

      <aside className="grid gap-4">
        <TelegramNotificationsCard
          role="owner"
          status={telegramStatus}
          linkAction={startTelegramNotificationLinkAction}
          toggleAction={setTelegramNotificationsEnabledAction}
        />
        <Panel className="grid gap-4 p-4" surface="raised">
          <div className="grid gap-1.5">
            <h2 className="text-lg font-semibold text-[var(--text)]">Установка на главный экран</h2>
            <p className="text-sm leading-[1.5] text-[var(--text-muted)]">Быстрый доступ к Bronly с телефона без App Store и Google Play.</p>
          </div>
          <InstallAppCard />
        </Panel>
      </aside>
    </section>
  );
}
