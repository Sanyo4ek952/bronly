import type { TelegramNotificationStatus } from "@/entities/notification/api/telegram-link";
import { formatDateTimeLabel } from "@/shared/lib/date";
import { SubmitButton } from "@/shared/ui";

type TelegramNotificationsCardProps = {
  role: "owner" | "agent";
  status: TelegramNotificationStatus;
  action: (formData: FormData) => Promise<void>;
};

export function TelegramNotificationsCard({ role, status, action }: TelegramNotificationsCardProps) {
  const linkedLabel = status.username ? `@${status.username}` : status.chatId ? `chat ${status.chatId}` : "РќРµ РїСЂРёРІСЏР·Р°РЅ";

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Telegram-СѓРІРµРґРѕРјР»РµРЅРёСЏ</h2>
          <p>РљР°РЅР°Р» РґР»СЏ СЃРѕР±С‹С‚РёР№ РїРѕ Р·Р°СЏРІРєР°Рј, РїСЂРµРґР»РѕР¶РµРЅРёСЏРј Р°РіРµРЅС‚РѕРІ Рё РїРѕРґРїРёСЃРєРµ.</p>
        </div>
      </div>
      <div className="br-toggle-list">
        <div className="br-toggle">
          <span>РЎС‚Р°С‚СѓСЃ РєР°РЅР°Р»Р°</span>
          <strong>{status.isLinked ? "РџСЂРёРІСЏР·Р°РЅ" : "РќРµ РїСЂРёРІСЏР·Р°РЅ"}</strong>
        </div>
        <div className="br-toggle">
          <span>Р§Р°С‚</span>
          <strong>{linkedLabel}</strong>
        </div>
        <div className="br-toggle">
          <span>РћС‚РїСЂР°РІРєР°</span>
          <strong>{status.telegramEnabled ? "Р’РєР»СЋС‡РµРЅР°" : "Р’С‹РєР»СЋС‡РµРЅР°"}</strong>
        </div>
        {status.linkedAt ? (
          <div className="br-toggle">
            <span>РџСЂРёРІСЏР·Р°РЅ</span>
            <strong>{formatDateTimeLabel(status.linkedAt)}</strong>
          </div>
        ) : null}
      </div>
      <p style={{ marginTop: 16 }}>
        {status.botConfigured
          ? "РћС‚РєСЂРѕР№С‚Рµ Р±РѕС‚Р° Bronly Рё РЅР°Р¶РјРёС‚Рµ Start. РџРѕСЃР»Рµ РїСЂРёРІСЏР·РєРё СѓРІРµРґРѕРјР»РµРЅРёСЏ Р±СѓРґСѓС‚ РїСЂРёС…РѕРґРёС‚СЊ РІ СЌС‚РѕС‚ С‡Р°С‚."
          : "Р‘РѕС‚ Telegram РµС‰Рµ РЅРµ РЅР°СЃС‚СЂРѕРµРЅ РІ РѕРєСЂСѓР¶РµРЅРёРё. In-app Рё PWA push РїСЂРѕРґРѕР»Р¶Р°СЋС‚ СЂР°Р±РѕС‚Р°С‚СЊ."}
      </p>
      <form action={action} style={{ marginTop: 16 }}>
        <input type="hidden" name="role" value={role} />
        <SubmitButton variant="secondary" disabled={!status.botConfigured} pendingLabel="Переход">
          {status.isLinked ? "РџРµСЂРµРїСЂРёРІСЏР·Р°С‚СЊ Telegram" : "РџСЂРёРІСЏР·Р°С‚СЊ Telegram"}
        </SubmitButton>
      </form>
    </section>
  );
}
