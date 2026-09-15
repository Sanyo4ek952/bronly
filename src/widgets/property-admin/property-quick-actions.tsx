import { BedDouble, CalendarDays, Inbox } from "lucide-react";

import type { OwnerInventoryDashboardItem } from "@/entities/property";
import { ButtonLink } from "@/shared/ui";

type PropertyQuickActionsProps = {
  item: OwnerInventoryDashboardItem;
};

function getRoomsHref(item: OwnerInventoryDashboardItem) {
  return item.kind === "property" ? `/dashboard/properties/${item.id}/rooms` : `/dashboard/rooms/${item.id}`;
}

function getCalendarHref(item: OwnerInventoryDashboardItem) {
  return item.kind === "property" ? `/dashboard/properties/${item.id}/calendar` : `/dashboard/rooms/${item.id}/calendar`;
}

const actionClass = "relative min-h-10 min-w-0 flex-1 bg-[var(--surface-subtle)] px-2 text-xs max-[520px]:text-[10px]";

export function PropertyQuickActions({ item }: PropertyQuickActionsProps) {
  return (
    <div className="flex min-w-0 flex-1 gap-2 max-[520px]:gap-1.5">
      <ButtonLink href={getRoomsHref(item)} variant="ghost" className={actionClass}>
        <BedDouble aria-hidden="true" className="size-4 shrink-0 max-[520px]:hidden" strokeWidth={1.9} />
        <span>{item.kind === "property" ? "Номера" : "Параметры"}</span>
      </ButtonLink>

      <ButtonLink href={getCalendarHref(item)} variant="ghost" className={actionClass}>
        <CalendarDays aria-hidden="true" className="size-4 shrink-0 max-[520px]:hidden" strokeWidth={1.9} />
        <span>Календарь</span>
      </ButtonLink>

      <ButtonLink href="/dashboard/requests" variant="ghost" className={actionClass}>
        <Inbox aria-hidden="true" className="size-4 shrink-0 max-[520px]:hidden" strokeWidth={1.9} />
        <span>Заявки</span>
        {item.newRequestsCount > 0 ? (
          <strong className="min-w-5 rounded-full bg-[var(--surface-muted)] px-1.5 py-0.5 text-[11px] text-[var(--accent-strong)] max-[520px]:absolute max-[520px]:right-1 max-[520px]:top-1 max-[520px]:min-w-[17px] max-[520px]:px-1 max-[520px]:text-[9px]">
            {item.newRequestsCount}
          </strong>
        ) : null}
      </ButtonLink>
    </div>
  );
}
