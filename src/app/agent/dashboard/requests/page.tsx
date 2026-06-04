import { redirect } from "next/navigation";

import { getAgentRequests } from "@/entities/request";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { Button } from "@/shared/ui";
import {
  requestAgentCompletionAction,
  transferAgentRequestAction,
} from "@/app/agent/dashboard/requests/actions";

function getStatusLabel(status: Awaited<ReturnType<typeof getAgentRequests>>[number]["status"]) {
  switch (status) {
    case "transferred_to_owner":
      return "РџРµСЂРµРґР°РЅР° РІР»Р°РґРµР»СЊС†Сѓ";
    case "accepted_by_owner":
      return "РџСЂРёРЅСЏС‚Р° РІР»Р°РґРµР»СЊС†РµРј";
    case "rejected":
      return "РћС‚РєР»РѕРЅРµРЅР°";
    case "completed":
      return "Р—Р°РІРµСЂС€РµРЅР°";
    default:
      return "РќРѕРІР°СЏ";
  }
}

function getSourceLabel(source: Awaited<ReturnType<typeof getAgentRequests>>[number]["source"]) {
  return source === "collection" ? "РљРѕР»Р»РµРєС†РёСЏ" : "РђРіРµРЅС‚СЃРєР°СЏ СЃСЃС‹Р»РєР°";
}

export default async function AgentRequestsPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const requests = await getAgentRequests(profile);

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>РђРіРµРЅС‚СЃРєРёРµ Р·Р°СЏРІРєРё</h2>
          <p>Р—Р°СЏРІРєРё, РєРѕС‚РѕСЂС‹Рµ РїСЂРёС€Р»Рё РїРѕ РІР°С€РёРј СЃСЃС‹Р»РєР°Рј Рё РєРѕР»Р»РµРєС†РёСЏРј.</p>
        </div>
      </div>
      <div className="br-requests-list">
        {requests.length ? (
          requests.map((item) => (
            <article key={item.id} className="br-request-item">
              <div className="br-request-item__avatar">{item.guestName[0]}</div>
              <div className="br-request-item__body">
                <strong>{item.guestName}</strong>
                <span>{item.createdAt}</span>
                <span>
                  {item.propertyTitle} вЂў {item.roomTitle}
                </span>
                <span>{getSourceLabel(item.source)}</span>
                <span>
                  {item.guestsLabel} вЂў {item.roomsCount} РєРѕРјРЅ. вЂў {item.totalPrice.toLocaleString("ru-RU")} в‚Ѕ
                </span>
                <span>{`${item.quotedPricePerNight.toLocaleString("ru-RU")} в‚Ѕ / РЅРѕС‡СЊ`}</span>
              </div>
              <div className="br-owner-stack">
                <span className="br-request-item__status">{getStatusLabel(item.status)}</span>
                {item.canTransferToOwner ? (
                  <form action={transferAgentRequestAction}>
                    <input type="hidden" name="requestId" value={item.id} />
                    <Button type="submit" variant="secondary">
                      РџРµСЂРµРґР°С‚СЊ РІР»Р°РґРµР»СЊС†Сѓ
                    </Button>
                  </form>
                ) : null}
                {item.canRequestCompletion ? (
                  <form action={requestAgentCompletionAction}>
                    <input type="hidden" name="requestId" value={item.id} />
                    <Button type="submit" variant="secondary">
                      РџРѕРїСЂРѕСЃРёС‚СЊ РѕС‚РјРµС‚РёС‚СЊ Р·Р°РІРµСЂС€РµРЅРЅРѕР№
                    </Button>
                  </form>
                ) : null}
                {item.status === "accepted_by_owner" && item.completionRequestedAt ? (
                  <p className="br-inline-notice br-inline-notice--soft">Р—Р°РїСЂРѕСЃ РІР»Р°РґРµР»СЊС†Сѓ РѕС‚РїСЂР°РІР»РµРЅ.</p>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p>РџРѕРєР° РЅРµС‚ Р·Р°СЏРІРѕРє РїРѕ Р°РіРµРЅС‚СЃРєРёРј СЃСЃС‹Р»РєР°Рј.</p>
        )}
      </div>
    </section>
  );
}
