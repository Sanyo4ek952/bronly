import { Handshake, Inbox } from "lucide-react";

import {
  getOwnerActiveCollaborations,
  getOwnerIncomingAgentProposals,
} from "@/entities/collaboration";
import { AppIcon, Button, InlineNotice, Panel, StatusPill, type AppIconComponent } from "@/shared/ui";
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

function getCountLabel(count: number, forms: [string, string, string]) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} ${forms[2]}`;
  if (lastDigit === 1) return `${count} ${forms[0]}`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} ${forms[1]}`;
  return `${count} ${forms[2]}`;
}

function AgentPageHeader() {
  return (
    <header className="grid max-w-[760px] gap-2">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">Сотрудничество</p>
      <h1 className="text-[clamp(32px,5vw,46px)] font-bold leading-[1.02] tracking-[-0.04em] text-[var(--text)]">Агенты</h1>
      <p className="text-sm leading-[1.6] text-[var(--text-muted)]">
        Рассматривайте новые предложения и держите под рукой контакты агентов, с которыми уже работаете.
      </p>
    </header>
  );
}

function EmptyState({ icon, title, description }: { icon: AppIconComponent; title: string; description: string }) {
  return (
    <Panel className="flex min-h-[150px] items-center gap-4 p-6 shadow-[var(--shadow-md)] max-[420px]:grid max-[640px]:p-4" surface="raised">
      <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[var(--surface-subtle)] text-[var(--accent-strong)]" aria-hidden="true">
        <AppIcon icon={icon} className="size-5" strokeWidth={2} />
      </span>
      <div className="grid gap-1.5">
        <h3 className="text-base font-bold leading-tight text-[var(--text)]">{title}</h3>
        <p className="text-sm leading-[1.55] text-[var(--text-muted)]">{description}</p>
      </div>
    </Panel>
  );
}

export default async function OwnerAgentProposalsPage({ searchParams }: OwnerAgentProposalsPageProps) {
  const [proposals, activeCollaborations, params] = await Promise.all([
    getOwnerIncomingAgentProposals(),
    getOwnerActiveCollaborations(),
    searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}),
  ]);

  if (!proposals || !activeCollaborations) {
    return (
      <section className="grid gap-6 max-[640px]:gap-5">
        <AgentPageHeader />
        <InlineNotice title="Не удалось загрузить сотрудничества" tone="warning" aria-live="polite">
          Данные временно недоступны. Попробуйте обновить страницу позже.
        </InlineNotice>
      </section>
    );
  }

  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";
  const feedback = getFeedback(success, error);

  return (
    <section className="grid min-w-0 gap-6 max-[640px]:gap-5">
      <AgentPageHeader />

      <InlineNotice tone="soft">
        После принятия агент видит календарь занятости только для чтения и может настроить только свою надбавку. Данные владельца он не редактирует.
      </InlineNotice>

      {feedback ? <InlineNotice tone={error ? "error" : "default"} aria-live="polite">{feedback}</InlineNotice> : null}

      <section className="grid min-w-0 gap-[14px]" aria-labelledby="incoming-agent-proposals-title">
        <div className="flex min-w-0 items-end justify-between gap-4 max-[480px]:items-start">
          <div className="grid min-w-0 gap-1">
            <h2 id="incoming-agent-proposals-title" className="text-[23px] font-bold leading-[1.1] tracking-[-0.025em] text-[var(--text)]">Входящие предложения</h2>
            <p className="text-[13px] leading-[1.5] text-[var(--text-muted)]">Проверьте вариант, сообщение агента и примите решение.</p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--surface-subtle)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-muted)]">
            {getCountLabel(proposals.length, ["предложение", "предложения", "предложений"])}
          </span>
        </div>

        {proposals.length ? (
          <Panel className="overflow-hidden shadow-[var(--shadow-md)]" surface="raised">
            <ol className="divide-y divide-[var(--border)]">
              {proposals.map((item) => (
                <li key={`${item.targetType}-${item.id}`}>
                  <article className="grid min-w-0 gap-5 p-6 max-[640px]:p-4 md:grid-cols-[minmax(0,1fr)_196px] md:gap-6">
                    <div className="grid min-w-0 content-start gap-[15px]">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid size-[42px] shrink-0 place-items-center rounded-[14px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-[13px] font-extrabold text-[var(--accent-strong)]" aria-hidden="true">
                          {item.agentName[0] ?? "А"}
                        </span>
                        <div className="grid min-w-0 gap-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="min-w-0 text-[13px] font-bold text-[var(--text-muted)]">Агент: {item.agentName}</p>
                            <StatusPill variant="pending">Ожидает</StatusPill>
                          </div>
                          <h3 className="[overflow-wrap:anywhere] text-base font-bold leading-[1.3] text-[var(--text)]">{item.title}</h3>
                        </div>
                      </div>
                      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                        <span>{getTargetFormatLabel(item.targetType)}</span>
                        <time>{item.createdAt}</time>
                      </p>
                      <p className="border-l-2 border-[rgb(var(--color-primary-rgb)_/_0.28)] pl-3 text-sm leading-[1.6] text-[var(--text)]">
                        {item.message || "Агент отправил предложение без дополнительного сообщения."}
                      </p>
                    </div>
                    <div className="grid content-center gap-2 border-t border-[var(--border)] pt-[18px] md:border-l md:border-t-0 md:pl-6 md:pt-0" aria-label="Решение по предложению">
                      <form action={acceptAgentProposalAction}>
                        <input type="hidden" name="proposalId" value={item.id} />
                        <input type="hidden" name="targetType" value={item.targetType} />
                        <Button className="min-h-11" type="submit" fullWidth>Принять</Button>
                      </form>
                      <form action={rejectAgentProposalAction}>
                        <input type="hidden" name="proposalId" value={item.id} />
                        <input type="hidden" name="targetType" value={item.targetType} />
                        <Button className="min-h-11" type="submit" variant="danger" fullWidth>Отклонить</Button>
                      </form>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          </Panel>
        ) : (
          <EmptyState
            icon={Inbox}
            title="Новых предложений пока нет"
            description="Когда агент предложит сотрудничество по объекту или отдельному номеру, оно появится здесь."
          />
        )}
      </section>

      <section className="grid min-w-0 gap-[14px]" aria-labelledby="active-agent-collaborations-title">
        <div className="flex min-w-0 items-end justify-between gap-4 max-[480px]:items-start">
          <div className="grid min-w-0 gap-1">
            <h2 id="active-agent-collaborations-title" className="text-[23px] font-bold leading-[1.1] tracking-[-0.025em] text-[var(--text)]">Активные сотрудничества</h2>
            <p className="text-[13px] leading-[1.5] text-[var(--text-muted)]">Контакты, условия и варианты, доступные каждому агенту.</p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--surface-subtle)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-muted)]">
            {getCountLabel(activeCollaborations.length, ["агент", "агента", "агентов"])}
          </span>
        </div>

        {activeCollaborations.length ? (
          <Panel className="overflow-hidden shadow-[var(--shadow-md)]" surface="raised">
            <ul className="divide-y divide-[var(--border)]">
              {activeCollaborations.map((item) => (
                <li key={item.agentId}>
                  <article className="grid min-w-0 gap-6 p-6 max-[640px]:p-4 lg:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.28fr)]">
                    <div className="grid min-w-0 content-start gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid size-[42px] shrink-0 place-items-center rounded-[14px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-[13px] font-extrabold text-[var(--accent-strong)]" aria-hidden="true">
                          {item.agentName[0] ?? "А"}
                        </span>
                        <div className="grid min-w-0 gap-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h3 className="[overflow-wrap:anywhere] text-base font-bold leading-[1.3] text-[var(--text)]">{item.agentName}</h3>
                            <StatusPill variant="active">Активно</StatusPill>
                          </div>
                          <p className="text-[13px] font-bold text-[var(--text-muted)]">Агент</p>
                        </div>
                      </div>
                      <section className="grid gap-2.5" aria-label={`Контакты агента ${item.agentName}`}>
                        <h4 className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-[var(--text-muted)]">Контакты агента</h4>
                        <CollaborationContactLinks contact={item.agentContact} />
                      </section>
                    </div>
                    <div className="grid min-w-0 content-start gap-4 border-t border-[var(--border)] pt-[18px] lg:border-t-0 lg:pt-0">
                      <section className="grid gap-2.5" aria-label={`Цели сотрудничества с агентом ${item.agentName}`}>
                        <h4 className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-[var(--text-muted)]">Цели сотрудничества</h4>
                        <CollaborationTargets targets={item.targets} presentation="flat" />
                      </section>
                      <section className="grid gap-2 border-t border-[var(--border)] pt-4" aria-label={`Условия сотрудничества с агентом ${item.agentName}`}>
                        <h4 className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-[var(--text-muted)]">Условия сотрудничества</h4>
                        <p className="text-sm leading-[1.6] text-[var(--text-muted)]">{item.terms}</p>
                      </section>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </Panel>
        ) : (
          <EmptyState
            icon={Handshake}
            title="Активных сотрудничеств пока нет"
            description="Принятое предложение создаст активную связь и появится в этом списке."
          />
        )}
      </section>
    </section>
  );
}
