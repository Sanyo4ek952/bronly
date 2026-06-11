"use client";

import { useState } from "react";

import type { ReferralInviteRole, ReferralInviteSummary } from "@/entities/referral/model/types";
import { Tabs } from "@/shared/ui";

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
    <section className="br-owner-stack">
      <section className="br-dashboard-block br-card br-referral-switcher">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Приглашения</h2>
            <p>Выберите, для какой роли подготовить персональную ссылку.</p>
          </div>
        </div>
        <Tabs
          ariaLabel="Выбор роли приглашения"
          items={tabItems}
          value={activeRole}
          onChange={(value) => setActiveRole(value as ReferralInviteRole)}
          className="br-tab-row--compact"
        />
      </section>

      <ReferralShareCard invite={activeInvite} title={activeInvite.title} description={activeInvite.description} />
    </section>
  );
}
