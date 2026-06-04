import { redirect } from "next/navigation";

import { getAgentCalendarData } from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { AgentCalendarBrowser } from "@/widgets/agent-calendar-browser/agent-calendar-browser";

export default async function AgentCalendarPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const properties = await getAgentCalendarData(profile);

  return (
    <section className="br-owner-stack">
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Календарь занятости</h2>
            <p>Просмотр занятых дат подключенных объектов и номеров по активным сотрудничествам.</p>
          </div>
        </div>

        <div className="br-inline-notice br-inline-notice--soft">
          Агент видит только данные по активным сотрудничествам и только в режиме чтения. Из этого раздела нельзя менять
          объект, номер, цены, фото или занятые даты владельца.
        </div>
      </section>

      {properties.length ? (
        <AgentCalendarBrowser properties={properties} />
      ) : (
        <section className="br-dashboard-block br-card">
          <div className="br-empty-state">
            <strong>Активных сотрудничеств пока нет</strong>
            <p>Когда владелец примет предложение о сотрудничестве, здесь появится календарь занятости подключенных номеров.</p>
          </div>
        </section>
      )}
    </section>
  );
}
