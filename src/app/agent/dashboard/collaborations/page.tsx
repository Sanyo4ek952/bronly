import { redirect } from "next/navigation";

import {
  getAgentActiveCollaborations,
  getAgentOutgoingProposals,
  type AgentCollaborationItem,
  type CollaborationContact,
  type CollaborationTargetSummary,
} from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { Button, Input } from "@/shared/ui";

import { saveAgentRoomMarkupAction } from "./actions";

type AgentCollaborationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}

function getMessage(success: string, error: string) {
  if (success === "saved") {
    return "Надбавка агента сохранена.";
  }

  if (error === "not_allowed") {
    return "Надбавку можно задавать только для своих номеров или для номеров по активному сотрудничеству.";
  }

  if (error === "validation") {
    return "Проверьте значение надбавки и попробуйте снова.";
  }

  if (error === "unauthorized") {
    return "Нужен вход в аккаунт агента.";
  }

  if (error) {
    return "Не удалось сохранить надбавку агента. Попробуйте еще раз.";
  }

  return "";
}

function getTargetFormatLabel(targetType: CollaborationTargetSummary["targetType"]) {
  return targetType === "property" ? "Формат: объект" : "Формат: отдельный номер";
}

function ContactLinks({ contact }: { contact: CollaborationContact }) {
  if (!contact.phone && !contact.whatsapp && !contact.telegram) {
    return <span>Контакты владельца скрыты или не заполнены.</span>;
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

function ActiveCollaborationCard({ item }: { item: AgentCollaborationItem }) {
  return (
    <article className="br-request-item" style={{ alignItems: "stretch" }}>
      <div className="br-request-item__avatar">{item.ownerName[0] ?? "В"}</div>
      <div className="br-request-item__body" style={{ width: "100%" }}>
        <strong>{item.title}</strong>
        <span>{item.ownerName}</span>
        <span className="br-request-item__status">{item.statusLabel}</span>

        <div className="br-owner-stack" style={{ marginTop: 12 }}>
          <div>
            <strong>Контакты владельца</strong>
            <div style={{ marginTop: 8 }}>
              {item.ownerContactVisible ? (
                <ContactLinks contact={item.ownerContact} />
              ) : (
                <span>Владелец не открыл контакты для этого сотрудничества.</span>
              )}
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

          {item.rooms.length ? (
            <div className="br-owner-stack" style={{ marginTop: 4 }}>
              {item.rooms.map((room) => (
                <form
                  key={room.id}
                  action={saveAgentRoomMarkupAction}
                  className="br-owner-editor br-owner-editor--muted"
                >
                  <input type="hidden" name="roomId" value={room.id} />
                  <div className="br-owner-editor__header">
                    <div>
                      <strong>{room.title}</strong>
                      <p>{room.subtitle || "Номер доступен в агентской витрине."}</p>
                    </div>
                  </div>
                  <div className="br-property-form__grid">
                    <Input
                      id={`room-base-price-${room.id}`}
                      label="Базовая цена владельца"
                      value={formatMoney(room.basePricePerNight)}
                      readOnly
                      disabled
                    />
                    <Input
                      id={`room-markup-${room.id}`}
                      name="markupPercent"
                      type="number"
                      min="0"
                      step="0.01"
                      label="Надбавка агента, %"
                      defaultValue={String(room.agentMarkupPercent)}
                    />
                    <Input
                      id={`room-agent-price-${room.id}`}
                      label="Итоговая цена агента за ночь"
                      value={formatMoney(room.agentPricePerNight)}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="br-owner-actions">
                    <Button type="submit">Сохранить надбавку</Button>
                  </div>
                </form>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default async function AgentCollaborationsPage({ searchParams }: AgentCollaborationsPageProps) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";
  const [activeCollaborations, outgoingProposals] = await Promise.all([
    getAgentActiveCollaborations(profile),
    getAgentOutgoingProposals(profile),
  ]);
  const proposalItems = outgoingProposals.filter((item) => item.status !== "active");
  const message = getMessage(success, error);

  return (
    <section className="br-owner-stack">
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Связи с владельцами</h2>
            <p>Здесь видны отправленные предложения и активные сотрудничества по объектам и отдельным номерам.</p>
          </div>
        </div>

        <div className="br-inline-notice br-inline-notice--soft">
          Агент задает только свою надбавку. Базовая цена владельца показывается для чтения и не редактируется.
        </div>

        {message ? <div className="br-inline-notice">{message}</div> : null}
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Активные сотрудничества</h2>
            <p>Контакты владельца, условия сотрудничества и объекты, по которым уже есть активная договоренность.</p>
          </div>
        </div>

        {activeCollaborations.length ? (
          <div className="br-requests-list">
            {activeCollaborations.map((item) => (
              <ActiveCollaborationCard key={`${item.targetType}-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <p>Пока нет активных связей с владельцами.</p>
        )}
      </section>

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Отправленные предложения</h2>
            <p>Здесь остаются предложения, которые еще ожидают решения или были отклонены.</p>
          </div>
        </div>

        {proposalItems.length ? (
          <div className="br-requests-list">
            {proposalItems.map((item) => (
              <article key={`${item.targetType}-${item.id}`} className="br-request-item">
                <div className="br-request-item__avatar">{item.ownerName[0] ?? "В"}</div>
                <div className="br-request-item__body">
                  <strong>{item.title}</strong>
                  <span>{getTargetFormatLabel(item.targetType)}</span>
                  <span>Владелец: {item.ownerName}</span>
                  <span>{item.createdAt}</span>
                  <span>{item.message || "Сообщение не добавлено."}</span>
                  <span className="br-request-item__status">{item.statusLabel}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>Пока нет отправленных предложений владельцам.</p>
        )}
      </section>
    </section>
  );
}
