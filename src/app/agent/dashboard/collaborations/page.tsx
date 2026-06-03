import { redirect } from "next/navigation";

import { getAgentOutgoingProposals } from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";

export default async function AgentCollaborationsPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const proposals = await getAgentOutgoingProposals(profile);

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Связи с владельцами</h2>
          <p>Здесь видны отправленные предложения, активные сотрудничества и решения владельцев.</p>
        </div>
      </div>
      <div className="br-requests-list">
        {proposals.length ? proposals.map((item) => (
          <article key={item.id} className="br-request-item">
            <div className="br-request-item__avatar">{item.ownerName[0] ?? "В"}</div>
            <div className="br-request-item__body">
              <strong>{item.propertyTitle}</strong>
              <span>{item.ownerName}</span>
              <span>{item.createdAt}</span>
              <span>{item.message || "Сообщение не добавлено"}</span>
            </div>
            <span className="br-request-item__status">{item.statusLabel}</span>
          </article>
        )) : <p>Пока нет отправленных предложений и активных связей.</p>}
      </div>
    </section>
  );
}
