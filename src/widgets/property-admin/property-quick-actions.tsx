import { BedDouble, CalendarDays, ExternalLink, Inbox } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";
import type { OwnerInventoryDashboardItem } from "@/entities/property";

import { inventorySurfaceButtonClass } from "./property-inventory-ui";

type PropertyQuickActionsProps = {
  item: OwnerInventoryDashboardItem;
};

function getRoomsHref(item: OwnerInventoryDashboardItem) {
  return item.kind === "property" ? `/dashboard/properties/${item.id}/rooms` : `/dashboard/rooms/${item.id}`;
}

function getCalendarHref(item: OwnerInventoryDashboardItem) {
  return item.kind === "property" ? `/dashboard/properties/${item.id}/calendar` : `/dashboard/rooms/${item.id}/calendar`;
}

function getOpenHref(item: OwnerInventoryDashboardItem) {
  if (item.publicHref) {
    return item.publicHref;
  }

  return item.kind === "property" ? `/dashboard/properties/${item.id}` : `/dashboard/rooms/${item.id}/settings`;
}

const actionChipClass = cn(
  inventorySurfaceButtonClass,
  "relative min-w-0 flex-1 gap-2 text-sm font-semibold",
  "max-[520px]:grid max-[520px]:min-h-[54px] max-[520px]:justify-items-center max-[520px]:gap-1.5 max-[520px]:px-1 max-[520px]:pb-1.5 max-[520px]:pt-2 max-[520px]:text-[11px] max-[520px]:leading-[1.1]",
);

export function PropertyQuickActions({ item }: PropertyQuickActionsProps) {
  return (
    <div className="flex min-w-0 flex-1 gap-2.5 max-[720px]:gap-2 max-[520px]:grid max-[520px]:grid-cols-3">
      <Link href={getRoomsHref(item)} className={actionChipClass}>
        <BedDouble aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
        <span className="max-[520px]:text-center">{item.kind === "property" ? "Номера" : "Параметры"}</span>
      </Link>

      <Link href={getCalendarHref(item)} className={actionChipClass}>
        <CalendarDays aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
        <span className="max-[520px]:text-center">Календарь</span>
      </Link>

      <Link href="/dashboard/requests" className={actionChipClass}>
        <Inbox aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
        <span className="max-[520px]:text-center">Заявки</span>
        {item.newRequestsCount > 0 ? (
          <strong
            className={cn(
              "min-w-5 rounded-full bg-[rgb(98_148_255_/_0.16)] px-1.5 py-0.5 text-xs text-[#3f6ad8]",
              "max-[520px]:absolute max-[520px]:right-2 max-[520px]:top-2 max-[520px]:min-w-[18px] max-[520px]:px-[5px] max-[520px]:py-px max-[520px]:text-[11px]",
            )}
          >
            {item.newRequestsCount}
          </strong>
        ) : null}
      </Link>

      <Link
        href={getOpenHref(item)}
        className={cn(actionChipClass, "min-w-28 flex-none max-[520px]:hidden")}
        target={item.publicHref ? "_blank" : undefined}
        rel={item.publicHref ? "noreferrer" : undefined}
      >
        <ExternalLink aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
        <span>Открыть</span>
      </Link>
    </div>
  );
}
