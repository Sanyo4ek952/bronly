import { getAdminSubscriptionsPageData } from "@/entities/admin";
import { readFeedbackSearchParams, readSearchParams } from "@/shared/lib";
import { AdminSubscriptionsPage, getAdminFeedbackMessage } from "@/widgets/admin-dashboard";

type AdminSubscriptionsRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSubscriptionsRoute({ searchParams }: AdminSubscriptionsRouteProps) {
  const params = await readSearchParams(searchParams);
  const { success, error, focus } = readFeedbackSearchParams(params);
  const data = await getAdminSubscriptionsPageData();
  const message = getAdminFeedbackMessage({ success, error });

  return <AdminSubscriptionsPage data={data} message={message} focusKey={focus} />;
}
