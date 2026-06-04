import { redirect } from "next/navigation";

import { getAgentCollaborations } from "@/entities/collaboration";
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
    return "Можно задавать надбавку только для своих комнат или для комнат по активному сотрудничеству.";
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

export default async function AgentCollaborationsPage({ searchParams }: AgentCollaborationsPageProps) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";
  const collaborations = await getAgentCollaborations(profile);
  const message = getMessage(success, error);

  return (
    <section className="br-owner-stack">
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Связи с владельцами</h2>
            <p>Здесь видны отправленные предложения, активные сотрудничества и надбавка агента по доступным комнатам.</p>
          </div>
        </div>

        <div className="br-inline-notice br-inline-notice--soft">
          Агент задает только свою надбавку. Базовая цена владельца показывается для чтения и не редактируется.
        </div>

        {message ? <div className="br-inline-notice">{message}</div> : null}
      </section>

      <div className="br-requests-list">
        {collaborations.length ? (
          collaborations.map((item) => (
            <article key={item.id} className="br-request-item" style={{ alignItems: "stretch" }}>
              <div className="br-request-item__avatar">{item.ownerName[0] ?? "В"}</div>
              <div className="br-request-item__body" style={{ width: "100%" }}>
                <strong>{item.propertyTitle}</strong>
                <span>{item.ownerName}</span>
                <span>{item.terms || "Сообщение не добавлено"}</span>
                <span className="br-request-item__status">{item.statusLabel}</span>

                {item.status === "active" ? (
                  item.rooms.length ? (
                    <div className="br-owner-stack" style={{ marginTop: 16 }}>
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
                              <p>{room.subtitle || "Комната доступна в агентской витрине."}</p>
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
                  ) : (
                    <p style={{ marginTop: 12 }}>В активном сотрудничестве пока нет доступных комнат для настройки надбавки.</p>
                  )
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p>Пока нет отправленных предложений и активных связей.</p>
        )}
      </div>
    </section>
  );
}
