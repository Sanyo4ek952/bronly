"use client";

import { useState } from "react";

import type { ReferralInviteRole, ReferralInviteSummary } from "@/entities/referral/model/types";
import { Panel, Tabs } from "@/shared/ui";

import { ReferralShareCard } from "./referral-share-card";

type ReferralSharePanelProps = {
  initialRole: ReferralInviteRole;
  invites: Record<ReferralInviteRole, ReferralInviteSummary>;
  presentation?: "default" | "owner";
};

const tabItems = [
  { value: "owner", label: "Владелец" },
  { value: "agent", label: "Агент" },
] satisfies Array<{ value: ReferralInviteRole; label: string }>;

const ownerTabItems = tabItems.map((item) => ({
  ...item,
  id: `owner-referral-tab-${item.value}`,
  panelId: "owner-referral-panel",
}));

export function ReferralSharePanel({ initialRole, invites, presentation = "default" }: ReferralSharePanelProps) {
  const [activeRole, setActiveRole] = useState<ReferralInviteRole>(initialRole);
  const activeInvite = invites[activeRole];

  if (presentation === "owner") {
    return (
      <section className="grid min-w-0 gap-6 max-[640px]:gap-5">
        <header className="grid max-w-[760px] gap-2">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">
            Рост через рекомендации
          </p>
          <h1 className="text-[clamp(32px,5vw,46px)] font-bold leading-[1.02] tracking-[-0.04em] text-[var(--text)]">
            Персональные приглашения
          </h1>
          <p className="text-sm leading-[1.6] text-[var(--text-muted)]">
            Отправьте готовую ссылку владельцу или агенту. После его целевого действия администратор сможет вручную подтвердить продление на 10 дней.
          </p>
        </header>

        <Tabs
          ariaLabel="Выбор роли приглашения"
          items={ownerTabItems}
          value={activeRole}
          onChange={(value) => setActiveRole(value as ReferralInviteRole)}
          className="mt-0 w-fit min-w-[300px] max-[640px]:w-full max-[640px]:min-w-0 [&_[role=tab]]:flex-1 max-[640px]:[&_[role=tab]]:min-h-11"
        />

        <ReferralShareCard
          invite={activeInvite}
          title={activeInvite.title}
          description={activeInvite.description}
          presentation="owner"
          activeTabId={`owner-referral-tab-${activeRole}`}
        />
      </section>
    );
  }

  return (
    <section className="grid min-w-0 gap-4">
      <Panel className="grid min-w-0 gap-4 p-4 sm:p-5" surface="raised">
        <div className="grid gap-1.5">
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-[var(--text)]">Приглашения</h1>
          <p className="text-sm leading-[1.55] text-[var(--text-muted)]">
            Выберите роль. Каждая персональная ссылка сохраняет вас как пригласившего и фиксирует ожидаемую роль нового пользователя.
          </p>
        </div>
        <Tabs
          ariaLabel="Выбор роли приглашения"
          items={tabItems}
          value={activeRole}
          onChange={(value) => setActiveRole(value as ReferralInviteRole)}
          className="mt-0"
        />
      </Panel>

      <ReferralShareCard invite={activeInvite} title={activeInvite.title} description={activeInvite.description} />
    </section>
  );
}
