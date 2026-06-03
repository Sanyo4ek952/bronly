import { redirect } from "next/navigation";

import { getAgentCollaborations } from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";

export default async function AgentCollaborationsPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const collaborations = await getAgentCollaborations(profile);

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Связи с владельцами</h2>
          <p>Активные и ожидающие сотрудничества объекты.</p>
        </div>
      </div>
      <div className="br-requests-list">
        {collaborations.length ? collaborations.map((item) => (
          <article key={item.id} className="br-request-item">
            <div className="br-request-item__avatar">{item.ownerName[0]}</div>
            <div className="br-request-item__body">
              <strong>{item.propertyTitle}</strong>
              <span>{item.ownerName}</span>
              <span>{item.terms}</span>
            </div>
            <span className="br-request-item__status">{item.status}</span>
          </article>
        )) : <p>Пока нет активных или ожидающих связей.</p>}
      </div>
    </section>
  );
}
