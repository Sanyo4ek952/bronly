import {
  getOwnerActiveCollaborations,
  getOwnerIncomingAgentProposals,
} from "@/entities/collaboration";
import { Button, InlineNotice, Panel, SectionHeader, StatusPill } from "@/shared/ui";
import {
  CollaborationContactLinks,
  CollaborationTargets,
  getTargetFormatLabel,
} from "@/widgets/collaboration-details";

import { acceptAgentProposalAction, rejectAgentProposalAction } from "./actions";

type OwnerAgentProposalsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getFeedback(success: string, error: string) {
  if (success === "accepted") return "Предложение принято. Вариант появился в активном сотрудничестве агента.";
  if (success === "declined") return "Предложение отклонено.";
  if (error === "subscription") return "Решение по предложению временно недоступно, пока подписка не продлена.";
  if (error === "not_found") return "Предложение уже обработано или относится к другому владельцу.";
  if (error === "validation") return "Не удалось определить предложение.";
  if (error === "unauthorized") return "Действие доступно только владельцу варианта.";
  if (error) return "Не удалось сохранить решение. Попробуйте еще раз.";
  return "";
}

export default async function OwnerAgentProposalsPage({ searchParams }: OwnerAgentProposalsPageProps) {
  const [proposals, activeCollaborations, params] = await Promise.all([
    getOwnerIncomingAgentProposals(),
    getOwnerActiveCollaborations(),
    searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}),
  ]);

  if (!proposals || !activeCollaborations) {
    return (
      <InlineNotice title="Не удалось загрузить сотрудничества" tone="warning" aria-live="polite">
        Данные временно недоступны. Попробуйте обновить страницу позже.
      </InlineNotice>
    );
  }

  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";
  const feedback = getFeedback(success, error);

  return (
    <div className="grid gap-4">
      <Panel className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
        <SectionHeader title="Предложения агентов" description="Примите или отклоните предложение до появления объекта или отдельного номера в агентской витрине." />
        <InlineNotice tone="soft">После принятия агент видит календарь занятости только для чтения и может настроить только свою надбавку. Данные владельца он не редактирует.</InlineNotice>
        {feedback ? <InlineNotice tone={error ? "error" : "default"}>{feedback}</InlineNotice> : null}
      </Panel>

      {proposals.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {proposals.map((item) => (
            <Panel key={`${item.targetType}-${item.id}`} as="article" className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[16px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-sm font-extrabold text-[var(--color-primary-hover)]">{item.agentName[0] ?? "А"}</span>
                  <div className="grid min-w-0 gap-1">
                    <h2 className="text-lg font-bold leading-tight">{item.title}</h2>
                    <p className="text-sm text-[var(--text-muted)]">Агент: {item.agentName}</p>
                  </div>
                </div>
                <StatusPill variant="pending">Ожидает</StatusPill>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{getTargetFormatLabel(item.targetType)} • {item.createdAt}</p>
              <p className="text-sm leading-relaxed text-[var(--text)]">{item.message || "Агент отправил предложение без дополнительного сообщения."}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <form action={acceptAgentProposalAction}>
                  <input type="hidden" name="proposalId" value={item.id} />
                  <input type="hidden" name="targetType" value={item.targetType} />
                  <Button type="submit" fullWidth>Принять</Button>
                </form>
                <form action={rejectAgentProposalAction}>
                  <input type="hidden" name="proposalId" value={item.id} />
                  <input type="hidden" name="targetType" value={item.targetType} />
                  <Button type="submit" variant="danger" fullWidth>Отклонить</Button>
                </form>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="p-5 text-sm text-[var(--text-muted)]" surface="subtle">Пока нет новых предложений от агентов.</Panel>
      )}

      <section className="grid gap-4">
        <SectionHeader title="Активные сотрудничества" description="Агенты, их контакты и варианты, по которым уже действует договоренность." />
        {activeCollaborations.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeCollaborations.map((item) => (
              <Panel key={item.agentId} as="article" className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-[16px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-sm font-extrabold text-[var(--color-primary-hover)]">{item.agentName[0] ?? "А"}</span>
                    <div className="grid gap-1"><h3 className="text-lg font-bold">{item.agentName}</h3><p className="text-sm text-[var(--text-muted)]">Активный агент</p></div>
                  </div>
                  <StatusPill variant="active">Активно</StatusPill>
                </div>
                <section className="grid gap-2"><strong className="text-sm">Контакты агента</strong><CollaborationContactLinks contact={item.agentContact} /></section>
                <section className="grid gap-2"><strong className="text-sm">Цели сотрудничества</strong><CollaborationTargets targets={item.targets} /></section>
                <Panel className="grid gap-1 rounded-[18px]" surface="subtle" padding="md"><strong className="text-sm">Условия сотрудничества</strong><p className="text-sm leading-relaxed text-[var(--text-muted)]">{item.terms}</p></Panel>
              </Panel>
            ))}
          </div>
        ) : (
          <Panel className="p-5 text-sm text-[var(--text-muted)]" surface="subtle">Пока нет активных договоренностей с агентами.</Panel>
        )}
      </section>
    </div>
  );
}
