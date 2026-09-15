import { redirect } from "next/navigation";

import { getAgentDashboardSummary } from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { ButtonLink, InlineNotice, Panel, SectionHeader, StatCard } from "@/shared/ui";

export default async function AgentDealsPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const summary = await getAgentDashboardSummary(profile);

  if (summary.loadState === "unavailable") {
    return (
      <InlineNotice title="Не удалось загрузить сделки" tone="warning" aria-live="polite">
        Данные временно недоступны. Попробуйте обновить страницу позже.
      </InlineNotice>
    );
  }

  return (
    <Panel className="grid gap-5 p-5 max-[640px]:p-4" surface="raised">
      <SectionHeader title="Сделки" description="Сделка считается завершенной только после действия владельца по принятой заявке." />
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard title="Завершенные сделки" value={summary.completedDeals} subtitle="Статус completed" />
        <StatCard title="Кто завершает" value="Владелец" subtitle="Агент может только отправить запрос" />
      </div>
      <InlineNotice tone="soft">Bronly не рассчитывает и не выплачивает комиссию агента. Условия сотрудничества стороны согласуют самостоятельно.</InlineNotice>
      <div className="flex justify-start">
        <ButtonLink href="/agent/dashboard/requests" variant="secondary">Открыть заявки</ButtonLink>
      </div>
    </Panel>
  );
}
