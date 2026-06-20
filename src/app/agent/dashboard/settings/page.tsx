import Link from "next/link";
import { redirect } from "next/navigation";

import { startTelegramNotificationLinkAction, updateProfileAction } from "@/app/auth/actions";
import { getMyTelegramNotificationStatus } from "@/entities/notification";
import { InstallAppCard } from "@/features/pwa/install-app";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { buildAgentPublicPath } from "@/shared/lib/public-links";
import { SubmitButton } from "@/shared/ui";
import { TelegramNotificationsCard } from "@/widgets/telegram-notifications-card";

type AgentSettingsPageProps = {
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
            <h2>РџСЂРѕС„РёР»СЊ Р°РіРµРЅС‚Р°</h2>
            <p>РљРѕРЅС‚Р°РєС‚С‹, РєРѕС‚РѕСЂС‹Рµ РіРѕСЃС‚СЊ РІРёРґРёС‚ РїРѕ Р°РіРµРЅС‚СЃРєРѕР№ СЃСЃС‹Р»РєРµ.</p>
          </div>
        </div>
        {getErrorMessage(error) ? <p className="br-card" style={{ marginBottom: 16 }}>{getErrorMessage(error)}</p> : null}
        {success === "saved" ? <p className="br-card" style={{ marginBottom: 16 }}>РџСЂРѕС„РёР»СЊ РѕР±РЅРѕРІР»РµРЅ.</p> : null}
        <form action={updateProfileAction}>
          <input type="hidden" name="role" value="agent" />
          <div className="br-settings-grid">
            <div className="br-form-field">
              <label className="br-label" htmlFor="display-name">РРјСЏ</label>
              <input id="display-name" name="displayName" className="br-field" defaultValue={profile.displayName} />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="phone">РўРµР»РµС„РѕРЅ</label>
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
              <span className="br-label">РџСѓР±Р»РёС‡РЅР°СЏ СЃСЃС‹Р»РєР°</span>
              {publicAgentPath ? (
                <Link href={publicAgentPath} className="br-field" style={{ display: "block", textDecoration: "none" }}>
                  {publicAgentPath}
                </Link>
              ) : (
                <div className="br-field">РЎСЃС‹Р»РєР° РіРµРЅРµСЂРёСЂСѓРµС‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.</div>
              )}
            </div>
          </div>
          <div className="br-active-step__actions">
            <Link href="/forgot-password" className="br-button br-button--secondary">РР·РјРµРЅРёС‚СЊ РїР°СЂРѕР»СЊ</Link>
            <SubmitButton pendingLabel="Сохранение">РЎРѕС…СЂР°РЅРёС‚СЊ</SubmitButton>
          </div>
        </form>
      </section>

      <aside>
        <TelegramNotificationsCard role="agent" status={telegramStatus} action={startTelegramNotificationLinkAction} />
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
