import { getAdminPropertiesPageData } from "@/entities/admin";
import { AdminPropertiesPage, getAdminFeedbackMessage } from "@/widgets/admin-dashboard";

type AdminPropertiesRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminPropertiesRoute({ searchParams }: AdminPropertiesRouteProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const success = getSearchString(params, "success");
  const error = getSearchString(params, "error");
  const data = await getAdminPropertiesPageData();
  const message = getAdminFeedbackMessage({ success, error });

  return <AdminPropertiesPage data={data} message={message} />;
}
