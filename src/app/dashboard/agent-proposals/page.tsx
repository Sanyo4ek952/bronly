import {
  getOwnerActiveCollaborations,
  getOwnerIncomingAgentProposals,
  type CollaborationContact,
  type CollaborationTargetSummary,
} from "@/entities/collaboration";
import { Button } from "@/shared/ui";

import { acceptAgentProposalAction, rejectAgentProposalAction } from "./actions";

function getTargetFormatLabel(targetType: CollaborationTargetSummary["targetType"]) {
  return targetType === "property" ? "Формат: объект" : "Формат: отдельный номер";
}

function ContactLinks({ contact }: { contact: CollaborationContact }) {
  if (!contact.phone && !contact.whatsapp && !contact.telegram) {
    return <span>Контакты не заполнены.</span>;
  }

  return (
    <div className="br-owner-stack" style={{ gap: 8 }}>
      {contact.phone ? (
        <a href={`tel:${contact.phone}`} className="br-button br-button--secondary br-button--sm">
          {contact.phone}
        </a>
      ) : null}
      {contact.whatsapp ? (
        <a href={contact.whatsapp} className="br-button br-button--secondary br-button--sm">
          WhatsApp
        </a>
      ) : null}
      {contact.telegram ? (
        <a
          href={contact.telegram.startsWith("http") ? contact.telegram : `https://t.me/${contact.telegram.replace(/^@/, "")}`}
          className="br-button br-button--secondary br-button--sm"
        >
          Telegram
        </a>
      ) : null}
    </div>
  );
}

function CollaborationTargets({ targets }: { targets: CollaborationTargetSummary[] }) {
  return (
    <div className="br-owner-stack" style={{ gap: 8 }}>
      {targets.map((target) => (
        <div key={`${target.targetType}-${target.id}`} className="br-owner-editor br-owner-editor--muted">
          <strong>{target.targetTitle}</strong>
          <p>{getTargetFormatLabel(target.targetType)}</p>
        </div>
      ))}
    </div>
  );
}

export default async function OwnerAgentProposalsPage() {
  const [proposals, activeCollaborations] = await Promise.all([
    getOwnerIncomingAgentProposals(),
    getOwnerActiveCollaborations(),
  ]);

  return (
    <section className="br-owner-stack">
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Предложения агентов</h2>
            <p>Владелец принимает или отклоняет предложение до появления объекта или номера в активном сотрудничестве.</p>
          </div>
        </div>

        {proposals.length ? (
          <div className="br-requests-list">
            {proposals.map((item) => (
              <article key={`${item.targetType}-${item.id}`} className="br-request-item">
                <div className="br-request-item__avatar">{item.agentName[0] ?? "А"}</div>
                <div className="br-request-item__body">
                  <strong>{item.title}</strong>
                  <span>{getTargetFormatLabel(item.targetType)}</span>
                  <span>Агент: {item.agentName}</span>
                  <span>{item.createdAt}</span>
                  <span>{item.message || "Агент отправил предложение без дополнительного сообщения."}</span>
                </div>
                <div className="br-owner-stack">
                  <form action={acceptAgentProposalAction}>
                    <input type="hidden" name="proposalId" value={item.id} />
                    <input type="hidden" name="targetType" value={item.targetType} />
                    <Button type="submit">Принять</Button>
                  </form>
                  <form action={rejectAgentProposalAction}>
                    <input type="hidden" name="proposalId" value={item.id} />
                    <input type="hidden" name="targetType" value={item.targetType} />
                    <Button type="submit" variant="danger">
                      Отклонить
                    </Button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>Пока нет новых предложений от агентов.</p>
        )}
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Активные сотрудничества</h2>
            <p>Здесь собраны агенты, с которыми уже есть активная договоренность, их контакты и объекты сотрудничества.</p>
          </div>
        </div>

        {activeCollaborations.length ? (
          <div className="br-requests-list">
            {activeCollaborations.map((item) => (
              <article key={item.agentId} className="br-request-item" style={{ alignItems: "stretch" }}>
                <div className="br-request-item__avatar">{item.agentName[0] ?? "А"}</div>
                <div className="br-request-item__body" style={{ width: "100%" }}>
                  <strong>{item.agentName}</strong>
                  <span className="br-request-item__status">Активно</span>

                  <div className="br-owner-stack" style={{ marginTop: 12 }}>
                    <div>
                      <strong>Контакты агента</strong>
                      <div style={{ marginTop: 8 }}>
                        <ContactLinks contact={item.agentContact} />
                      </div>
                    </div>

                    <div>
                      <strong>На какие объекты заключена договоренность</strong>
                      <div style={{ marginTop: 8 }}>
                        <CollaborationTargets targets={item.targets} />
                      </div>
                    </div>

                    <div className="br-owner-editor br-owner-editor--muted">
                      <strong>Условия сотрудничества</strong>
                      <p>{item.terms}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>Пока нет активных договоренностей с агентами.</p>
        )}
      </section>
    </section>
  );
}
