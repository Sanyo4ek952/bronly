import { Bell } from "lucide-react";
import Link from "next/link";

import { AppIcon } from "@/shared/ui";

type DashboardTopbarProps = {
  title: string;
  description: string;
  notificationsHref: string;
  unreadNotificationsCount?: number;
};

export function DashboardTopbar({
  title,
  description,
  notificationsHref,
  unreadNotificationsCount = 0,
}: DashboardTopbarProps) {
  const badgeLabel = unreadNotificationsCount > 99 ? "99+" : String(unreadNotificationsCount);

  return (
    <header className="br-owner-topbar br-card">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="br-owner-topbar__actions">
        <span className="br-owner-topbar__chip">Bronly</span>
        <Link className="br-icon-link" href={notificationsHref} aria-label="Уведомления">
          <AppIcon icon={Bell} aria-hidden="true" />
          {unreadNotificationsCount > 0 ? <span className="br-icon-link__badge">{badgeLabel}</span> : null}
        </Link>
      </div>
    </header>
  );
}
