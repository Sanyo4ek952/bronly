import { getOwnerDashboardSummary } from "@/entities/property";
import { OwnerDashboardOverview } from "@/widgets/owner-dashboard-overview";

export default async function DashboardPage() {
  const dashboardStats = await getOwnerDashboardSummary();

  return <OwnerDashboardOverview dashboardStats={dashboardStats} />;
}
