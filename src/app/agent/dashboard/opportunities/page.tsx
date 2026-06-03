import { redirect } from "next/navigation";

import { getAgentAvailableProperties } from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { Button, Textarea } from "@/shared/ui";

import { submitAgentProposalAction } from "./actions";

export default async function AgentOpportunitiesPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const properties = await getAgentAvailableProperties(profile);

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Объекты для сотрудничества</h2>
          <p>Здесь собраны объекты владельцев, которые открыты для предложений агентов.</p>
        </div>
      </div>

      {properties.length ? (
        <div className="br-requests-list">
          {properties.map((item) => (
            <article key={item.propertyId} className="br-request-item">
              <div className="br-request-item__avatar">{item.ownerName[0] ?? "В"}</div>
              <div className="br-request-item__body">
                <strong>{item.shortTitle || item.propertyTitle}</strong>
                <span>{item.city}, {item.address}</span>
                <span>Владелец: {item.ownerName}</span>
                <span>{item.shortDescription || "Владелец готов рассмотреть сотрудничество по этому объекту."}</span>

                <form action={submitAgentProposalAction} className="br-owner-stack" style={{ marginTop: 12, width: "100%" }}>
                  <input type="hidden" name="propertyId" value={item.propertyId} />
                  <Textarea
                    id={`message-${item.propertyId}`}
                    name="message"
                    label="Сообщение владельцу"
                    placeholder="Коротко опишите, как вы планируете работать с этим объектом."
                  />
                  <Button type="submit" variant="primary">Отправить предложение</Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>Пока нет объектов, открытых для новых предложений о сотрудничестве.</p>
      )}
    </section>
  );
}
