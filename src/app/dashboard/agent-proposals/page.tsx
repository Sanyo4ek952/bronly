import { getOwnerIncomingAgentProposals } from "@/entities/collaboration";
import { Button } from "@/shared/ui";

import { acceptAgentProposalAction, rejectAgentProposalAction } from "./actions";

export default async function OwnerAgentProposalsPage() {
  const proposals = await getOwnerIncomingAgentProposals();

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Предложения агентов</h2>
          <p>Владелец принимает или отклоняет предложение до появления объекта в агентской витрине.</p>
        </div>
      </div>

      {proposals.length ? (
        <div className="br-requests-list">
          {proposals.map((item) => (
            <article key={item.id} className="br-request-item">
              <div className="br-request-item__avatar">{item.agentName[0] ?? "А"}</div>
              <div className="br-request-item__body">
                <strong>{item.propertyTitle}</strong>
                <span>Агент: {item.agentName}</span>
                <span>{item.createdAt}</span>
                <span>{item.message || "Агент отправил предложение без дополнительного сообщения."}</span>
              </div>
              <div className="br-owner-stack">
                <form action={acceptAgentProposalAction}>
                  <input type="hidden" name="proposalId" value={item.id} />
                  <Button type="submit">Принять</Button>
                </form>
                <form action={rejectAgentProposalAction}>
                  <input type="hidden" name="proposalId" value={item.id} />
                  <Button type="submit" variant="danger">Отклонить</Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>Пока нет новых предложений от агентов.</p>
      )}
    </section>
  );
}
