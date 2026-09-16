import { redirect } from "next/navigation";

import { getAgentCalendarData } from "@/entities/collaboration";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { InlineNotice, Panel } from "@/shared/ui";
import { AdminPageHeader, ObjectStats } from "@/widgets/property-admin";
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

  const roomCount = properties.reduce((total, property) => total + property.rooms.length, 0);
  const busyRangeCount = properties.reduce(
    (propertyTotal, property) => propertyTotal + property.rooms.reduce((roomTotal, room) => roomTotal + room.busyRanges.length, 0),
    0,
  );

  return (
    <div className="grid min-w-0 gap-6 max-[720px]:gap-5">
      <AdminPageHeader
        variant="plain"
        title="Календарь занятости"
        description="Занятые даты подключенных объектов и отдельных номеров по активным сотрудничествам."
      />

      <InlineNotice tone="soft">
        Агент видит только данные по активным сотрудничествам и только в режиме чтения. Здесь нельзя менять объект, номер, цены, фото или занятые даты владельца.
      </InlineNotice>

      <Panel padding="md" aria-label="Сводка календаря агента">
        <ObjectStats
          compact
          stackOnMobile={false}
          items={[
            { label: "Варианты", value: String(properties.length) },
            { label: "Номера", value: String(roomCount) },
            { label: "Занятые диапазоны", value: String(busyRangeCount), tone: "accent" },
          ]}
        />
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
