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
    return "Telegram-Р±РѕС‚ РµС‰Рµ РЅРµ РЅР°СЃС‚СЂРѕРµРЅ.";
  }

  if (error === "telegram-link") {
    return "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ СЃСЃС‹Р»РєСѓ РґР»СЏ РїСЂРёРІСЏР·РєРё Telegram.";
  }

  if (error) {
    return "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ.";
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
            <h2>РџСЂРѕС„РёР»СЊ РІР»Р°РґРµР»СЊС†Р°</h2>
            <p>РљРѕРЅС‚Р°РєС‚С‹ Рё Р±Р°Р·РѕРІС‹Рµ РЅР°СЃС‚СЂРѕР№РєРё РєР°Р±РёРЅРµС‚Р°.</p>
          </div>
        </div>
        {getErrorMessage(error) ? <p className="br-card" style={{ marginBottom: 16 }}>{getErrorMessage(error)}</p> : null}
        {success === "saved" ? <p className="br-card" style={{ marginBottom: 16 }}>РџСЂРѕС„РёР»СЊ РѕР±РЅРѕРІР»РµРЅ.</p> : null}
        <div className="br-card" style={{ marginBottom: 16, padding: 16 }}>
          <strong>РџСѓР±Р»РёС‡РЅР°СЏ СЃС‚СЂР°РЅРёС†Р° РІР»Р°РґРµР»СЊС†Р°</strong>
          <p style={{ marginTop: 8 }}>{publicOwnerPath ?? "Р—Р°РїРѕР»РЅРёС‚Рµ slug, С‡С‚РѕР±С‹ РїРѕР»СѓС‡РёС‚СЊ СЃСЃС‹Р»РєСѓ /p/[profile.slug]."}</p>
          <div className="br-active-step__actions" style={{ marginTop: 12 }}>
            <Link href={publicOwnerPath ?? "/dashboard/settings"} className="br-button br-button--secondary">
              {publicOwnerPath ? "РћС‚РєСЂС‹С‚СЊ РїСѓР±Р»РёС‡РЅСѓСЋ СЃС‚СЂР°РЅРёС†Сѓ" : "Р—Р°РїРѕР»РЅРёС‚СЊ slug"}
            </Link>
          </div>
        </div>
        <form action={updateProfileAction}>
          <input type="hidden" name="role" value="owner" />
          <div className="br-settings-grid">
            <div className="br-form-field">
              <label className="br-label" htmlFor="display-name">РРјСЏ</label>
              <input id="display-name" name="displayName" className="br-field" defaultValue={profile?.displayName} />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="phone">РўРµР»РµС„РѕРЅ</label>
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
            <Link href="/forgot-password" className="br-button br-button--secondary">РР·РјРµРЅРёС‚СЊ РїР°СЂРѕР»СЊ</Link>
            <SubmitButton pendingLabel="Сохранение">РЎРѕС…СЂР°РЅРёС‚СЊ</SubmitButton>
          </div>
        </form>
      </section>

      <aside>
        <TelegramNotificationsCard role="owner" status={telegramStatus} action={startTelegramNotificationLinkAction} />
        <div style={{ height: 16 }} />
        <section className="br-dashboard-block br-card">
          <div className="br-dashboard-block__header">
            <div>
              <h2>РЈСЃС‚Р°РЅРѕРІРєР° РЅР° РіР»Р°РІРЅС‹Р№ СЌРєСЂР°РЅ</h2>
              <p>Р‘С‹СЃС‚СЂС‹Р№ РґРѕСЃС‚СѓРї Рє Bronly СЃ С‚РµР»РµС„РѕРЅР° Р±РµР· App Store Рё Google Play.</p>
            </div>
          </div>
          <InstallAppCard />
        </section>
      </aside>
    </section>
  );
}
