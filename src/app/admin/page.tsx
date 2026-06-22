import { getAdminOverviewData } from "@/entities/admin";
import { readFeedbackSearchParams, readSearchParams } from "@/shared/lib";
import { AdminOverview, getAdminFeedbackMessage } from "@/widgets/admin-dashboard";

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await readSearchParams(searchParams);
  const { success, error } = readFeedbackSearchParams(params);
  const data = await getAdminOverviewData();
  const message = getAdminFeedbackMessage({ success, error });

  return <AdminOverview data={data} message={message} />;
}
