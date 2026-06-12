import { getAdminSubscriptionsPageData } from "@/entities/admin";
import { AdminSubscriptionsPage, getAdminFeedbackMessage } from "@/widgets/admin-dashboard";

type AdminSubscriptionsRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminSubscriptionsRoute({ searchParams }: AdminSubscriptionsRouteProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const success = getSearchString(params, "success");
  const error = getSearchString(params, "error");
  const focus = getSearchString(params, "focus");
  const data = await getAdminSubscriptionsPageData();
  const message = getAdminFeedbackMessage({ success, error });

  return <AdminSubscriptionsPage data={data} message={message} focusKey={focus} />;
}
