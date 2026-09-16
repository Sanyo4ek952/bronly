import { redirect } from "next/navigation";

import { getAgentDashboardSummary } from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { ButtonLink, InlineNotice, Panel, StatCard } from "@/shared/ui";
import { AdminPageHeader } from "@/widgets/property-admin";

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
    <div className="grid min-w-0 gap-6 max-[720px]:gap-5">
      <AdminPageHeader
        variant="plain"
        title="Сделки"
        description="Сделка считается завершенной только после действия владельца по принятой заявке."
      />
      <Panel className="grid gap-5 p-5 max-[640px]:p-4" surface="raised">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard title="Завершенные сделки" value={summary.completedDeals} subtitle="Статус completed" />
          <StatCard title="Кто завершает" value="Владелец" subtitle="Агент может только отправить запрос" />
        </div>
        <InlineNotice tone="soft">Bronly не рассчитывает и не выплачивает комиссию агента. Условия сотрудничества стороны согласуют самостоятельно.</InlineNotice>
        <div className="flex justify-start">
          <ButtonLink href="/agent/dashboard/requests" variant="secondary">Открыть заявки</ButtonLink>
        </div>
      </Panel>
    </div>
  );
}
