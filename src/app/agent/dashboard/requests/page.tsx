import { redirect } from "next/navigation";

import {
  requestAgentCompletionAction,
  transferAgentRequestAction,
} from "@/app/agent/dashboard/requests/actions";
import { getAgentRequests } from "@/entities/request";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { Button } from "@/shared/ui";

function getStatusLabel(status: Awaited<ReturnType<typeof getAgentRequests>>[number]["status"]) {
  switch (status) {
    case "transferred_to_owner":
      return "Передана владельцу";
    case "accepted_by_owner":
      return "Принята владельцем";
    case "rejected":
      return "Отклонена";
    case "completed":
      return "Завершена";
    default:
      return "Новая";
  }
}

function getSourceLabel(source: Awaited<ReturnType<typeof getAgentRequests>>[number]["source"]) {
  return source === "collection" ? "Коллекция" : "Агентская ссылка";
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
          <h2>Агентские заявки</h2>
          <p>Заявки, которые пришли по вашим ссылкам и коллекциям.</p>
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
                  {item.propertyTitle} • {item.roomTitle}
                </span>
                <span>{getSourceLabel(item.source)}</span>
                <span>
                  {item.guestsLabel} • {item.roomsCount} комн. • {item.totalPrice.toLocaleString("ru-RU")} ₽
                </span>
                <span>{`${item.quotedPricePerNight.toLocaleString("ru-RU")} ₽ / ночь`}</span>
              </div>
              <div className="br-owner-stack">
                <span className="br-request-item__status">{getStatusLabel(item.status)}</span>
                {item.canTransferToOwner ? (
                  <form action={transferAgentRequestAction}>
                    <input type="hidden" name="requestId" value={item.id} />
                    <Button type="submit" variant="secondary">
                      Передать владельцу
                    </Button>
                  </form>
                ) : null}
                {item.canRequestCompletion ? (
                  <form action={requestAgentCompletionAction}>
                    <input type="hidden" name="requestId" value={item.id} />
                    <Button type="submit" variant="secondary">
                      Попросить отметить завершенной
                    </Button>
                  </form>
                ) : null}
                {item.status === "accepted_by_owner" && item.completionRequestedAt ? (
                  <p className="br-inline-notice br-inline-notice--soft">Запрос владельцу отправлен.</p>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p>Пока нет заявок по агентским ссылкам.</p>
        )}
      </div>
    </section>
  );
}
