import { notFound } from "next/navigation";

import { getAdminSubscriptionDetailData } from "@/entities/admin";
import { AdminSubscriptionDetail } from "@/widgets/admin-dashboard";

type AdminSubscriptionDetailRouteProps = {
  params: Promise<{ profileId: string }>;
};

export default async function AdminSubscriptionDetailRoute({ params }: AdminSubscriptionDetailRouteProps) {
  const { profileId } = await params;
  const data = await getAdminSubscriptionDetailData(profileId);

  if (!data) {
    notFound();
  }

  return <AdminSubscriptionDetail data={data} />;
}
