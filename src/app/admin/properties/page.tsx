import { getAdminPropertiesPageData } from "@/entities/admin";
import { readFeedbackSearchParams, readSearchParams } from "@/shared/lib";
import { AdminPropertiesPage, getAdminFeedbackMessage } from "@/widgets/admin-dashboard";

type AdminPropertiesRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPropertiesRoute({ searchParams }: AdminPropertiesRouteProps) {
  const params = await readSearchParams(searchParams);
  const { success, error } = readFeedbackSearchParams(params);
  const data = await getAdminPropertiesPageData();
  const message = getAdminFeedbackMessage({ success, error });

  return <AdminPropertiesPage data={data} message={message} />;
}
