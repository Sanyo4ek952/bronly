import { redirect } from "next/navigation";

import { requestAgentCompletionAction, transferAgentRequestAction } from "@/app/agent/dashboard/requests/actions";
import { getAgentRequests, type AgentRequestItem } from "@/entities/request";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { toPhoneHref } from "@/shared/lib";
import { Button, ButtonLink, InlineNotice, Panel, StatusPill } from "@/shared/ui";
import { AdminPageHeader, ObjectStats } from "@/widgets/property-admin";

type AgentRequestsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStatusLabel(status: AgentRequestItem["status"]) {
  switch (status) {
    case "transferred_to_owner": return "Передана владельцу";
    case "accepted_by_owner": return "Принята владельцем";
    case "rejected": return "Отклонена";
    case "completed": return "Завершена";
    default: return "Новая";
  }
}

function getSourceLabel(source: AgentRequestItem["source"]) {
  return source === "collection" ? "Коллекция" : "Агентская ссылка";
}

function getActionMessage(success: string, error: string) {
  if (success === "transferred") return "Заявка передана владельцу.";
  if (success === "completion-requested") return "Запрос завершения отправлен владельцу.";
  if (error === "subscription") return "Действия с заявками временно недоступны, пока подписка не продлена.";
  if (error === "invalid_transition") return "Статус заявки уже изменился. Обновите страницу.";
  if (error === "not_found") return "Заявка не найдена или относится к другому агенту.";
  if (error === "unauthorized") return "Действие доступно только агенту, который получил заявку.";
  if (error) return "Не удалось изменить заявку. Попробуйте еще раз.";
  return "";
}

export default async function AgentRequestsPage({ searchParams }: AgentRequestsPageProps) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const [requests, params] = await Promise.all([
    getAgentRequests(profile),
    searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}),
  ]);

  if (!requests) {
    return (
      <InlineNotice title="Не удалось загрузить заявки" tone="warning" aria-live="polite">
        Данные временно недоступны. Попробуйте обновить страницу позже.
      </InlineNotice>
    );
  }

  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";
  const actionMessage = getActionMessage(success, error);
  const newRequestCount = requests.filter((item) => item.status === "new").length;
  const transferredRequestCount = requests.filter((item) => item.status === "transferred_to_owner").length;

  return (
    <div className="grid min-w-0 gap-6 max-[720px]:gap-5">
      <AdminPageHeader
        variant="plain"
        title="Агентские заявки"
        description="Запросы, которые пришли по вашей публичной ссылке или коллекциям."
      />

      <div className="grid gap-3">
        <InlineNotice tone="soft">
          Новая агентская заявка скрыта от владельца, пока вы не нажмете «Передать владельцу». Завершить сделку может только владелец.
        </InlineNotice>
        {actionMessage ? <InlineNotice tone={error ? "error" : "default"}>{actionMessage}</InlineNotice> : null}
      </div>

      <Panel padding="md" aria-label="Сводка агентских заявок">
        <ObjectStats
          compact
          stackOnMobile={false}
          items={[
            { label: "Все заявки", value: String(requests.length) },
            { label: "Новые", value: String(newRequestCount), tone: "accent" },
            { label: "Переданы", value: String(transferredRequestCount) },
          ]}
        />
      </Panel>

      {requests.length ? (
        <div className="grid gap-4">
          {requests.map((item) => {
            const phoneHref = toPhoneHref(item.phone);

            return (
              <Panel key={item.id} as="article" className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-[16px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-sm font-extrabold text-[var(--color-primary-hover)]">
                      {item.guestName[0] ?? "Г"}
                    </span>
                    <div className="grid min-w-0 gap-1">
                      <h2 className="text-lg font-bold leading-tight text-[var(--text)]">{item.guestName}</h2>
                      <p className="text-xs text-[var(--text-muted)]">{item.createdAt} • {getSourceLabel(item.source)}</p>
                    </div>
                  </div>
                  <StatusPill variant={item.status}>{getStatusLabel(item.status)}</StatusPill>
                </div>

                <div className="grid gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div><span className="text-xs text-[var(--text-muted)]">Вариант</span><strong className="mt-1 block text-sm">{item.propertyTitle} • {item.roomTitle}</strong></div>
                  <div><span className="text-xs text-[var(--text-muted)]">Даты</span><strong className="mt-1 block text-sm">{item.checkIn} — {item.checkOut}</strong></div>
                  <div><span className="text-xs text-[var(--text-muted)]">Гости и комнаты</span><strong className="mt-1 block text-sm">{item.guestsLabel} • {item.roomsCount} комн.</strong></div>
                  <div><span className="text-xs text-[var(--text-muted)]">Цена агента</span><strong className="mt-1 block text-sm">{item.totalPrice.toLocaleString("ru-RU")} ₽ • {item.quotedPricePerNight.toLocaleString("ru-RU")} ₽ / ночь</strong></div>
                </div>

                {item.comment ? <p className="text-sm leading-relaxed text-[var(--text-muted)]">Комментарий гостя: {item.comment}</p> : null}

                <div className="flex flex-wrap gap-2.5">
                  {phoneHref ? <ButtonLink href={phoneHref} variant="secondary">Позвонить {item.phone}</ButtonLink> : null}
                  {item.canTransferToOwner ? (
                    <form action={transferAgentRequestAction}>
                      <input type="hidden" name="requestId" value={item.id} />
                      <Button type="submit">Передать владельцу</Button>
                    </form>
                  ) : null}
                  {item.canRequestCompletion ? (
                    <form action={requestAgentCompletionAction}>
                      <input type="hidden" name="requestId" value={item.id} />
                      <Button type="submit" variant="secondary">Попросить отметить завершенной</Button>
                    </form>
                  ) : null}
                </div>

                {item.status === "accepted_by_owner" && item.completionRequestedAt ? (
                  <InlineNotice tone="soft">Запрос владельцу отметить сделку завершенной уже отправлен.</InlineNotice>
                ) : null}
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel className="grid gap-2 p-5 max-[640px]:p-4" surface="subtle">
          <strong>Пока нет агентских заявок</strong>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">Когда гость оставит запрос по вашей ссылке, он появится здесь.</p>
        </Panel>
      )}
    </div>
  );
}
