import { redirect } from "next/navigation";

import { getAgentRequests } from "@/entities/request";
import { getCurrentAuthProfile } from "@/shared/api/supabase";

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
          <p>Заявки, которые пришли по вашей ссылке.</p>
        </div>
      </div>
      <div className="br-requests-list">
        {requests.length ? requests.map((item) => (
          <article key={item.id} className="br-request-item">
            <div className="br-request-item__avatar">{item.guestName[0]}</div>
            <div className="br-request-item__body">
              <strong>{item.guestName}</strong>
              <span>{item.createdAt}</span>
              <span>{item.propertyTitle}</span>
            </div>
            <span className="br-request-item__status">{item.status}</span>
          </article>
        )) : <p>Пока нет заявок по агентским ссылкам.</p>}
      </div>
    </section>
  );
}
