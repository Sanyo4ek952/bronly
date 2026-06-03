import { redirect } from "next/navigation";

import { getAgentDashboardSummary } from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";

export default async function AgentDealsPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const summary = await getAgentDashboardSummary(profile);

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Сделки</h2>
          <p>В MVP сделка считается успешной только после статуса completed от владельца.</p>
        </div>
      </div>
      <div className="br-summary-card__rows">
        <div className="br-summary-card__row">
          <span>Завершенные сделки</span>
          <strong>{summary.completedDeals}</strong>
        </div>
        <div className="br-summary-card__row">
          <span>Подтверждение</span>
          <strong>Только владелец</strong>
        </div>
      </div>
    </section>
  );
}
