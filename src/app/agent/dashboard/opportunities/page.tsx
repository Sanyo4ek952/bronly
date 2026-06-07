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

  const inventory = await getAgentAvailableProperties(profile);

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Объекты и номера для сотрудничества</h2>
          <p>Здесь собраны объекты и отдельные номера владельцев, которые открыты для предложений агентов.</p>
        </div>
      </div>

      {inventory.length ? (
        <div className="br-requests-list">
          {inventory.map((item) => {
            const key = `${item.targetType}-${item.propertyId ?? item.roomId ?? item.title}`;

            return (
              <article key={key} className="br-request-item">
                <div className="br-request-item__avatar">{item.ownerName[0] ?? "В"}</div>
                <div className="br-request-item__body">
                  <strong>{item.shortTitle || item.title}</strong>
                  <span>{item.city}, {item.address}</span>
                  <span>{item.targetType === "property" ? "Формат: объект" : "Формат: отдельный номер"}</span>
                  <span>Владелец: {item.ownerName}</span>
                  <span>
                    {item.shortDescription ||
                      (item.targetType === "property"
                        ? "Владелец готов рассмотреть сотрудничество по этому объекту."
                        : "Владелец готов рассмотреть сотрудничество по этому номеру.")}
                  </span>

                  <form action={submitAgentProposalAction} className="br-owner-stack" style={{ marginTop: 12, width: "100%" }}>
                    <input type="hidden" name="targetType" value={item.targetType} />
                    {item.propertyId ? <input type="hidden" name="propertyId" value={item.propertyId} /> : null}
                    {item.roomId ? <input type="hidden" name="roomId" value={item.roomId} /> : null}
                    <Textarea
                      id={`message-${key}`}
                      name="message"
                      label="Сообщение владельцу"
                      placeholder={
                        item.targetType === "property"
                          ? "Коротко опишите, как вы планируете работать с этим объектом."
                          : "Коротко опишите, как вы планируете работать с этим номером."
                      }
                    />
                    <Button type="submit" variant="primary">
                      Отправить предложение
                    </Button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p>Пока нет объектов или отдельных номеров, открытых для новых предложений о сотрудничестве.</p>
      )}
    </section>
  );
}
