import { BedDouble, CalendarDays, ExternalLink, Inbox } from "lucide-react";
import Link from "next/link";

import type { OwnerInventoryDashboardItem } from "@/entities/property";
import { AppIcon } from "@/shared/ui";

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

export function PropertyQuickActions({ item }: PropertyQuickActionsProps) {
  return (
    <div className="br-property-hub-actions">
      <Link href={getRoomsHref(item)} className="br-property-hub-action-chip">
        <AppIcon icon={BedDouble} aria-hidden="true" />
        <span>{item.kind === "property" ? "Номера" : "Параметры"}</span>
      </Link>

      <Link href={getCalendarHref(item)} className="br-property-hub-action-chip">
        <AppIcon icon={CalendarDays} aria-hidden="true" />
        <span>Календарь</span>
      </Link>

      <Link href="/dashboard/requests" className="br-property-hub-action-chip">
        <AppIcon icon={Inbox} aria-hidden="true" />
        <span>Заявки</span>
        {item.newRequestsCount > 0 ? <strong>{item.newRequestsCount}</strong> : null}
      </Link>

      <Link
        href={getOpenHref(item)}
        className="br-property-hub-action-chip"
        target={item.publicHref ? "_blank" : undefined}
        rel={item.publicHref ? "noreferrer" : undefined}
      >
        <AppIcon icon={ExternalLink} aria-hidden="true" />
        <span>Открыть</span>
      </Link>
    </div>
  );
}
