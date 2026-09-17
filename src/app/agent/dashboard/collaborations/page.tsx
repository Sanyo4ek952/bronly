import { redirect } from "next/navigation";

import {
  getAgentActiveCollaborations,
  getAgentOutgoingProposals,
  type AgentCollaborationItem,
} from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { formatRubles } from "@/shared/lib/money";
import { Button, InlineNotice, Input, Panel, SectionHeader, StatusPill } from "@/shared/ui";
import {
  CollaborationContactLinks,
  CollaborationTargets,
  getTargetFormatLabel,
} from "@/widgets/collaboration-details";
import { AdminPageHeader, ObjectStats } from "@/widgets/property-admin";

import { saveAgentRoomMarkupAction } from "./actions";

type AgentCollaborationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(success: string, error: string) {
  if (success === "saved") return "Надбавка агента сохранена.";
  if (error === "not_allowed") return "Надбавка доступна только для своих номеров или номеров по активному сотрудничеству.";
  if (error === "validation") return "Укажите надбавку от 0 до 999,99%.";
  if (error === "unauthorized") return "Нужен вход в аккаунт агента.";
  if (error) return "Не удалось сохранить надбавку агента. Попробуйте еще раз.";
  return "";
}

function ActiveCollaborationCard({ item }: { item: AgentCollaborationItem }) {
  return (
    <Panel as="article" className="grid gap-5 p-5 max-[640px]:p-4" surface="raised">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-[16px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-sm font-extrabold text-[var(--color-primary-hover)]">
          {item.ownerName[0] ?? "В"}
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <h3 className="text-lg font-bold leading-tight text-[var(--text)]">{item.title}</h3>
          <p className="text-sm text-[var(--text-muted)]">Владелец: {item.ownerName}</p>
        </div>
        <StatusPill variant="active">{item.statusLabel}</StatusPill>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="grid content-start gap-2">
          <strong className="text-sm text-[var(--text)]">Контакты владельца</strong>
          {item.ownerContactVisible ? (
            <CollaborationContactLinks contact={item.ownerContact} emptyText="Контакты владельца не заполнены." />
          ) : (
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">Владелец не открыл контакты для этого сотрудничества.</p>
          )}
        </section>
        <section className="grid content-start gap-2">
          <strong className="text-sm text-[var(--text)]">Цели сотрудничества</strong>
          <CollaborationTargets targets={item.targets} />
        </section>
      </div>

      <Panel className="grid gap-1 rounded-[18px]" surface="subtle" padding="md">
        <strong className="text-sm text-[var(--text)]">Условия сотрудничества</strong>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">{item.terms}</p>
      </Panel>

      {item.rooms.length ? (
        <section className="grid gap-3">
          <div className="grid gap-1">
            <strong className="text-sm text-[var(--text)]">Цены агента</strong>
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">Базовая цена владельца доступна только для чтения. В витрине показывается итоговая цена с вашей надбавкой.</p>
          </div>
          {item.rooms.map((room) => (
            <form key={room.id} action={saveAgentRoomMarkupAction} className="grid gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <input type="hidden" name="roomId" value={room.id} />
              <div className="grid gap-1">
                <strong className="text-sm text-[var(--text)]">{room.title}</strong>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">{room.subtitle || "Номер доступен в агентской витрине."}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Input id={`room-base-price-${room.id}`} label="Базовая цена владельца" value={formatRubles(Math.round(room.basePricePerNight))} readOnly disabled />
                <Input id={`room-markup-${room.id}`} name="markupPercent" type="number" min="0" max="999.99" step="0.01" label="Надбавка агента, %" defaultValue={String(room.agentMarkupPercent)} required />
                <Input id={`room-agent-price-${room.id}`} label="Итоговая цена агента за ночь" value={formatRubles(Math.round(room.agentPricePerNight))} readOnly disabled />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Сохранить надбавку</Button>
              </div>
            </form>
          ))}
        </section>
      ) : null}
    </Panel>
  );
}

export default async function AgentCollaborationsPage({ searchParams }: AgentCollaborationsPageProps) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const [activeCollaborations, outgoingProposals, params] = await Promise.all([
    getAgentActiveCollaborations(profile),
    getAgentOutgoingProposals(profile),
    searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}),
  ]);

  if (!activeCollaborations || !outgoingProposals) {
    return (
      <InlineNotice title="Не удалось загрузить сотрудничества" tone="warning" aria-live="polite">
        Данные временно недоступны. Попробуйте обновить страницу позже.
      </InlineNotice>
    );
  }

  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";
  const message = getMessage(success, error);
  const proposalItems = outgoingProposals.filter((item) => item.status !== "active");
  const pendingProposalCount = proposalItems.filter((item) => item.status === "pending").length;

  return (
    <div className="grid min-w-0 gap-6 max-[720px]:gap-5">
      <AdminPageHeader
        variant="plain"
        title="Связи с владельцами"
        description="Отправленные предложения и активные сотрудничества по объектам и отдельным номерам."
      />

      <div className="grid gap-3">
        <InlineNotice tone="soft">Агент задает только свою надбавку. Объект, номер, фото, календарь и базовая цена владельца остаются только для чтения.</InlineNotice>
        {message ? <InlineNotice tone={error ? "error" : "default"}>{message}</InlineNotice> : null}
      </div>

      <Panel padding="md" aria-label="Сводка сотрудничеств">
        <ObjectStats
          compact
          stackOnMobile={false}
          items={[
            { label: "Активные связи", value: String(activeCollaborations.length), tone: "accent" },
            { label: "Ожидают решения", value: String(pendingProposalCount) },
            { label: "Другие предложения", value: String(proposalItems.length - pendingProposalCount) },
          ]}
        />
      </Panel>

      <section className="grid gap-4">
        <SectionHeader title="Активные сотрудничества" description="Контакты, условия и варианты, по которым владелец уже принял предложение." />
        {activeCollaborations.length ? (
          <div className="grid gap-4">
            {activeCollaborations.map((item) => <ActiveCollaborationCard key={`${item.targetType}-${item.id}`} item={item} />)}
          </div>
        ) : (
          <Panel className="p-5 text-sm text-[var(--text-muted)]" surface="subtle">Пока нет активных связей с владельцами.</Panel>
        )}
      </section>

      <Panel className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
        <SectionHeader title="Отправленные предложения" description="Предложения, которые ожидают решения владельца или были отклонены." />
        {proposalItems.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {proposalItems.map((item) => (
              <Panel key={`${item.targetType}-${item.id}`} as="article" className="grid gap-3 rounded-[20px]" surface="subtle" padding="md">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <strong>{item.title}</strong>
                    <span className="text-xs text-[var(--text-muted)]">{getTargetFormatLabel(item.targetType)}</span>
                  </div>
                  <StatusPill variant={item.status === "pending" ? "pending" : "inactive"}>{item.statusLabel}</StatusPill>
                </div>
                <p className="text-sm text-[var(--text-muted)]">Владелец: {item.ownerName}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.createdAt}</p>
                <p className="text-sm leading-relaxed text-[var(--text)]">{item.message || "Сообщение не добавлено."}</p>
              </Panel>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Пока нет отправленных предложений владельцам.</p>
        )}
      </Panel>
    </div>
  );
}
