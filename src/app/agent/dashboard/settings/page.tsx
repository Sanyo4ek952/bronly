import { redirect } from "next/navigation";

import {
  setTelegramNotificationsEnabledAction,
  startTelegramNotificationLinkAction,
  updateProfileAction,
} from "@/app/auth/actions";
import { getMyTelegramNotificationStatus } from "@/entities/notification";
import { InstallAppCard } from "@/features/pwa/install-app";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildAgentPublicPath } from "@/shared/lib/public-links";
import { ButtonLink, InlineNotice, Input, Panel, SubmitButton } from "@/shared/ui";
import { AdminPageHeader, CopyLinkButton } from "@/widgets/property-admin";
import { TelegramNotificationsCard } from "@/widgets/telegram-notifications-card";

type AgentSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getErrorMessage(error: string) {
  if (error === "max-url") return "Укажите ссылку на профиль MAX вида https://max.ru/u/…";
  if (error === "telegram-not-configured") return "Telegram-бот еще не настроен.";
  if (error === "telegram-link") return "Не удалось создать ссылку для привязки Telegram.";
  if (error === "telegram-setting") return "Не удалось изменить настройки Telegram-уведомлений.";
  if (error === "validation") return "Укажите имя агента и проверьте остальные поля.";
  if (error === "unauthorized") return "Настройки доступны только для профиля агента.";
  if (error) return "Не удалось сохранить изменения.";
  return "";
}

export default async function AgentSettingsPage({ searchParams }: AgentSettingsPageProps) {
  const [profile, telegramStatus] = await Promise.all([getCurrentAuthProfile(), getMyTelegramNotificationStatus()]);

  if (!profile) {
    redirect("/login");
  }

  const params = await (searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  const publicAgentPath = buildAgentPublicPath(profile.agentPublicId);

  return (
    <section className="grid min-w-0 gap-6 max-[720px]:gap-5">
      <AdminPageHeader
        variant="plain"
        title="Профиль агента"
        description="Контакты, которые гость видит по вашей агентской ссылке."
      />

      {getErrorMessage(error) || success ? (
        <div className="grid gap-3">
          {getErrorMessage(error) ? <InlineNotice tone="error">{getErrorMessage(error)}</InlineNotice> : null}
          {success === "saved" ? <InlineNotice>Профиль обновлен.</InlineNotice> : null}
          {success === "telegram-enabled" ? <InlineNotice>Telegram-уведомления включены.</InlineNotice> : null}
          {success === "telegram-disabled" ? <InlineNotice tone="soft">Telegram-уведомления отключены.</InlineNotice> : null}
        </div>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="grid gap-5 p-5 max-[640px]:p-4" surface="raised">

        <section className="grid gap-3 rounded-[20px] border border-[rgb(var(--color-primary-rgb)_/_0.16)] bg-[var(--color-primary-pale)] p-4">
          <div className="grid gap-1.5">
            <strong className="text-base text-[var(--text)]">Стабильная публичная ссылка</strong>
            <p className="break-all text-sm leading-relaxed text-[var(--text-muted)]">
              {publicAgentPath ?? "Ссылка создается автоматически и не редактируется вручную."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href={publicAgentPath ?? "#"} variant="secondary" disabled={!publicAgentPath}>Открыть витрину</ButtonLink>
            {publicAgentPath ? <CopyLinkButton path={publicAgentPath} /> : null}
          </div>
        </section>

        <form action={updateProfileAction} className="grid gap-5">
          <input type="hidden" name="role" value="agent" />
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="display-name" name="displayName" label="Имя" defaultValue={profile.displayName} required />
            <Input id="phone" name="phone" type="tel" label="Телефон" defaultValue={profile.phone} />
            <Input id="email" type="email" label="Email" defaultValue={profile.email} disabled />
            <Input id="max-url" name="maxUrl" type="url" label="MAX" description="Ссылка на ваш профиль из приложения MAX. Появится в публичных контактах." placeholder="https://max.ru/u/…" maxLength={2048} defaultValue={profile?.maxUrl} />
            <Input id="telegram" name="telegram" label="Telegram" placeholder="@username" defaultValue={profile.telegram} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ButtonLink href="/forgot-password" variant="secondary" fullWidth>Изменить пароль</ButtonLink>
            <SubmitButton pendingLabel="Сохранение">Сохранить</SubmitButton>
          </div>
        </form>
        </Panel>

        <aside className="grid gap-4">
          <TelegramNotificationsCard
            role="agent"
            status={telegramStatus}
            linkAction={startTelegramNotificationLinkAction}
            toggleAction={setTelegramNotificationsEnabledAction}
          />
          <Panel className="grid gap-4 p-4" surface="raised">
            <div className="grid gap-1.5">
              <h2 className="text-lg font-semibold text-[var(--text)]">Установка на главный экран</h2>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">Быстрый доступ к Bronly с телефона без App Store и Google Play.</p>
            </div>
            <InstallAppCard />
          </Panel>
        </aside>
      </div>
    </section>
  );
}
