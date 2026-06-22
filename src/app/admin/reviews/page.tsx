import { getAdminReviewsPageData } from "@/entities/admin";
import { readFeedbackSearchParams, readSearchParams } from "@/shared/lib";
import { AdminReviewsPage, getAdminFeedbackMessage } from "@/widgets/admin-dashboard";

type AdminReviewsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReviewsRoute({ searchParams }: AdminReviewsPageProps) {
  const params = await readSearchParams(searchParams);
  const { success, error } = readFeedbackSearchParams(params);
  const data = await getAdminReviewsPageData();
  const message = getAdminFeedbackMessage({ success, error });

  return <AdminReviewsPage data={data} message={message} />;
}
