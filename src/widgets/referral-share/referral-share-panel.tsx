"use client";

import { useState } from "react";

import type { ReferralInviteRole, ReferralInviteSummary } from "@/entities/referral/model/types";
import { Panel, Tabs } from "@/shared/ui";

import { ReferralShareCard } from "./referral-share-card";

type ReferralSharePanelProps = {
  initialRole: ReferralInviteRole;
  invites: Record<ReferralInviteRole, ReferralInviteSummary>;
};

const tabItems = [
  { value: "owner", label: "Владелец" },
  { value: "agent", label: "Агент" },
] satisfies Array<{ value: ReferralInviteRole; label: string }>;

export function ReferralSharePanel({ initialRole, invites }: ReferralSharePanelProps) {
  const [activeRole, setActiveRole] = useState<ReferralInviteRole>(initialRole);
  const activeInvite = invites[activeRole];

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
