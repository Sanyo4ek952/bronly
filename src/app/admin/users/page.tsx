import { getAdminUsersPageData } from "@/entities/admin";
import { AdminUsersPage, getAdminFeedbackMessage } from "@/widgets/admin-dashboard";

type AdminUsersRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminUsersRoute({ searchParams }: AdminUsersRouteProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const success = getSearchString(params, "success");
  const error = getSearchString(params, "error");
  const data = await getAdminUsersPageData();
  const message = getAdminFeedbackMessage({ success, error });

  return <AdminUsersPage data={data} message={message} />;
}
