import { redirect } from "next/navigation";

import { getAgentCalendarData } from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { InlineNotice, Panel, SectionHeader } from "@/shared/ui";
import { AgentCalendarBrowser } from "@/widgets/agent-calendar-browser/agent-calendar-browser";

export default async function AgentCalendarPage() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const properties = await getAgentCalendarData(profile);

  if (!properties) {
    return (
      <InlineNotice title="Не удалось загрузить календарь" tone="warning" aria-live="polite">
        Данные временно недоступны. Попробуйте обновить страницу позже.
      </InlineNotice>
    );
  }

  return (
    <div className="grid gap-4">
      <Panel className="grid gap-4 p-5 max-[640px]:p-4" surface="raised">
        <SectionHeader title="Календарь занятости" description="Занятые даты подключенных объектов и отдельных номеров по активным сотрудничествам." />
        <InlineNotice tone="soft">Агент видит только данные по активным сотрудничествам и только в режиме чтения. Здесь нельзя менять объект, номер, цены, фото или занятые даты владельца.</InlineNotice>
      </Panel>

      {properties.length ? (
        <AgentCalendarBrowser properties={properties} />
      ) : (
        <Panel className="grid gap-2 p-5 max-[640px]:p-4" surface="subtle">
          <strong>Активных сотрудничеств пока нет</strong>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">Когда владелец примет предложение, здесь появится календарь занятости подключенных номеров.</p>
        </Panel>
      )}
    </div>
  );
}
