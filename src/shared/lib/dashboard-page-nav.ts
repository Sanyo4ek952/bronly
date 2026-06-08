export type DashboardBreadcrumbItem = {
  label: string;
  href?: string;
};

export function buildOwnerDashboardBreadcrumbs(items: DashboardBreadcrumbItem[]): DashboardBreadcrumbItem[] {
  return [
    { label: "Кабинет", href: "/dashboard" },
    ...items,
  ];
}

export function buildOwnerInventoryBreadcrumbs(items: DashboardBreadcrumbItem[]): DashboardBreadcrumbItem[] {
  return buildOwnerDashboardBreadcrumbs([
    { label: "Объекты и номера", href: "/dashboard/properties" },
    ...items,
  ]);
}

export function buildOwnerCollectionsBreadcrumbs(items: DashboardBreadcrumbItem[]): DashboardBreadcrumbItem[] {
  return buildOwnerDashboardBreadcrumbs([
    { label: "Коллекции", href: "/dashboard/collections" },
    ...items,
  ]);
}

export function buildAgentCollectionsBreadcrumbs(items: DashboardBreadcrumbItem[]): DashboardBreadcrumbItem[] {
  return [
    { label: "Кабинет агента", href: "/agent/dashboard" },
    { label: "Коллекции", href: "/agent/dashboard/collections" },
    ...items,
  ];
}
