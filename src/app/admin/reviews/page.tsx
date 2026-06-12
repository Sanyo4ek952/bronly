import { getAdminReviewsPageData } from "@/entities/admin";
import { AdminReviewsPage, getAdminFeedbackMessage } from "@/widgets/admin-dashboard";

type AdminReviewsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminReviewsRoute({ searchParams }: AdminReviewsPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const success = getSearchString(params, "success");
  const error = getSearchString(params, "error");
  const data = await getAdminReviewsPageData();
  const message = getAdminFeedbackMessage({ success, error });

  return <AdminReviewsPage data={data} message={message} />;
}
