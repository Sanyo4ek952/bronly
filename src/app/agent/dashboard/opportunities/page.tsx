import { redirect } from "next/navigation";

import { getAgentAvailableProperties } from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { Button, InlineNotice, Panel, Textarea } from "@/shared/ui";
import { getTargetFormatLabel } from "@/widgets/collaboration-details";
import { AdminPageHeader } from "@/widgets/property-admin";

import { submitAgentProposalAction } from "./actions";

type AgentOpportunitiesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getErrorMessage(error: string) {
  if (error === "subscription") return "Отправка предложений временно недоступна, пока подписка не продлена.";
  if (error === "duplicate") return "Предложение уже отправлено или сотрудничество уже активно.";
  if (error === "not_available") return "Владелец больше не принимает предложения по этому варианту.";
  if (error === "unauthorized") return "Предложения доступны только для профиля агента.";
  if (error === "validation") return "Не удалось определить объект или отдельный номер.";
  if (error) return "Не удалось отправить предложение. Попробуйте еще раз.";
  return "";
}

export default async function AgentOpportunitiesPage({ searchParams }: AgentOpportunitiesPageProps) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const [inventory, params] = await Promise.all([
    getAgentAvailableProperties(profile),
    searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}),
  ]);

  if (!inventory) {
    return (
      <InlineNotice title="Не удалось загрузить предложения" tone="warning" aria-live="polite">
        Данные временно недоступны. Попробуйте обновить страницу позже.
      </InlineNotice>
    );
  }

  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";

  return (
    <div className="grid min-w-0 gap-6 max-[720px]:gap-5">
      <AdminPageHeader
        variant="plain"
        title="К сотрудничеству"
        description="Объекты и отдельные номера, по которым владельцы готовы рассмотреть предложение агента."
      />

      <div className="grid gap-3">
        <InlineNotice tone="soft">
          Отправка предложения не дает права редактировать данные владельца. Доступ к витрине и календарю появится только после принятия.
        </InlineNotice>
        {getErrorMessage(error) ? <InlineNotice tone="error">{getErrorMessage(error)}</InlineNotice> : null}
        {success === "sent" ? <InlineNotice>Предложение отправлено владельцу.</InlineNotice> : null}
      </div>

      {inventory.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {inventory.map((item) => {
            const key = `${item.targetType}-${item.propertyId ?? item.roomId ?? item.title}`;
            const location = [item.city, item.address].filter(Boolean).join(", ");

            return (
              <Panel key={key} as="article" className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[16px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-sm font-extrabold text-[var(--color-primary-hover)]">
                    {item.ownerName[0] ?? "В"}
                  </span>
                  <div className="grid min-w-0 gap-1">
                    <h2 className="text-lg font-bold leading-tight text-[var(--text)]">{item.shortTitle || item.title}</h2>
                    <p className="text-sm text-[var(--text-muted)]">{location || "Адрес уточняется у владельца"}</p>
                    <p className="text-xs font-semibold text-[var(--color-primary-hover)]">{getTargetFormatLabel(item.targetType)}</p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  <p>Владелец: {item.ownerName}</p>
                  <p>
                    {item.shortDescription ||
                      (item.targetType === "property"
                        ? "Владелец готов рассмотреть сотрудничество по этому объекту."
                        : "Владелец готов рассмотреть сотрудничество по этому номеру.")}
                  </p>
                </div>

                <form action={submitAgentProposalAction} className="grid gap-3">
                  <input type="hidden" name="targetType" value={item.targetType} />
                  {item.propertyId ? <input type="hidden" name="propertyId" value={item.propertyId} /> : null}
                  {item.roomId ? <input type="hidden" name="roomId" value={item.roomId} /> : null}
                  <Textarea
                    id={`message-${key}`}
                    name="message"
                    label="Сообщение владельцу"
                    rows={4}
                    placeholder="Коротко опишите, как вы планируете работать с этим вариантом."
                  />
                  <Button type="submit" fullWidth>Отправить предложение</Button>
                </form>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel className="grid gap-2 p-5 max-[640px]:p-4" surface="subtle">
          <strong>Новых вариантов пока нет</strong>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">Объекты и отдельные номера появятся здесь, когда владельцы откроют их для предложений.</p>
        </Panel>
      )}
    </div>
  );
}
