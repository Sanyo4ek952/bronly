import { getAdminUsersPageData } from "@/entities/admin";
import { readFeedbackSearchParams, readSearchParams } from "@/shared/lib";
import { AdminUsersPage, getAdminFeedbackMessage } from "@/widgets/admin-dashboard";

type AdminUsersRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersRoute({ searchParams }: AdminUsersRouteProps) {
  const params = await readSearchParams(searchParams);
  const { success, error } = readFeedbackSearchParams(params);
  const data = await getAdminUsersPageData();
  const message = getAdminFeedbackMessage({ success, error });

  return <AdminUsersPage data={data} message={message} />;
}
