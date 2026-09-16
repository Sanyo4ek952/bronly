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
    <section className="grid gap-5">
      <header className="grid max-w-[720px] gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">Профиль и каналы</p>
        <h1 className="text-[clamp(32px,5vw,46px)] font-bold leading-[1.02] tracking-[-0.04em] text-[var(--text)]">Настройки</h1>
        <p className="text-sm leading-[1.6] text-[var(--text-muted)]">
          Обновляйте контактные данные и управляйте тем, как получать уведомления о новых заявках.
        </p>
      </header>

      <section
        className="flex min-w-0 flex-col gap-4 rounded-[var(--radius-lg)] border border-[rgb(var(--color-primary-rgb)_/_0.16)] bg-[var(--color-primary-pale)] p-4 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="owner-public-page-title"
      >
        <div className="min-w-0">
          <h2 id="owner-public-page-title" className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Публичная страница
          </h2>
          <p className="mt-1 [overflow-wrap:anywhere] text-sm font-semibold leading-[1.5] text-[var(--text)]">
            {publicOwnerPath ?? "Задайте адрес страницы ниже, чтобы получить персональную ссылку для гостей."}
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 max-[360px]:grid-cols-1 [&>*]:min-h-11 [&>*]:w-full">
          {publicOwnerPath ? <CopyLinkButton path={publicOwnerPath} /> : null}
          <ButtonLink href={publicOwnerPath ?? "#public-slug"} variant="secondary" disabled={!publicOwnerPath}>
            Открыть страницу
          </ButtonLink>
        </div>
      </section>

      {getErrorMessage(error) ? <InlineNotice tone="error">{getErrorMessage(error)}</InlineNotice> : null}
      {success === "saved" ? <InlineNotice role="status">Профиль обновлен.</InlineNotice> : null}
      {success === "telegram-enabled" ? <InlineNotice role="status">Telegram-уведомления включены.</InlineNotice> : null}
      {success === "telegram-disabled" ? <InlineNotice role="status" tone="soft">Telegram-уведомления отключены.</InlineNotice> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="grid gap-6 p-6 max-[640px]:p-4" surface="raised" aria-labelledby="owner-profile-title">
          <div className="grid gap-1.5">
            <h2 id="owner-profile-title" className="text-2xl font-bold tracking-[-0.025em] text-[var(--text)]">Профиль</h2>
            <p className="text-sm leading-[1.55] text-[var(--text-muted)]">
              Эти данные помогают гостям связаться с вами после отправки заявки.
            </p>
          </div>

          <form action={updateProfileAction} className="grid gap-6">
            <input type="hidden" name="role" value="owner" />
            <div className="grid gap-4 md:grid-cols-2">
              <Input id="display-name" name="displayName" label="Имя" defaultValue={profile?.displayName} required />
              <Input id="phone" name="phone" type="tel" label="Телефон" defaultValue={profile?.phone} />
              <Input
                id="email"
                type="email"
                label="Email"
                description="Email связан с аккаунтом и не меняется здесь."
                defaultValue={profile?.email}
                disabled
              />
              <Input
                id="public-slug"
                name="slug"
                label="Адрес страницы"
                description="Используется в персональной ссылке после /p/."
                defaultValue={profile?.slug}
              />
              <Input
                id="telegram"
                name="telegram"
                label="Telegram"
                description="Имя пользователя для связи."
                placeholder="@username"
                defaultValue={profile?.telegram}
              />
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <ButtonLink href="/forgot-password" variant="ghost" className="min-h-11 sm:px-0">
                Изменить пароль
              </ButtonLink>
              <SubmitButton className="min-h-11 max-sm:w-full" pendingLabel="Сохранение">
                Сохранить изменения
              </SubmitButton>
            </div>
          </form>
        </Panel>

        <Panel as="aside" className="grid gap-6 p-6 max-[640px]:p-4" surface="raised" aria-labelledby="owner-channels-title">
          <div className="grid gap-1.5">
            <h2 id="owner-channels-title" className="text-2xl font-bold tracking-[-0.025em] text-[var(--text)]">Связь и приложение</h2>
            <p className="text-sm leading-[1.55] text-[var(--text-muted)]">Настройте уведомления и быстрый доступ с телефона.</p>
          </div>
          <TelegramNotificationsCard
            role="owner"
            status={telegramStatus}
            linkAction={startTelegramNotificationLinkAction}
            toggleAction={setTelegramNotificationsEnabledAction}
            embedded
          />
          <div className="border-t border-[var(--border)] pt-6">
            <InstallAppCard embedded />
          </div>
        </Panel>
      </div>
    </section>
  );
}
