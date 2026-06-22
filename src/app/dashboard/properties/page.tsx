import { getOwnerInventoryDashboardData } from "@/entities/property";
import { readFeedbackSearchParams, readSearchParams } from "@/shared/lib";
import { PropertyInventoryBrowser } from "@/widgets/property-admin";

import { getPropertyNotice, getRoomsNotice } from "./page-helpers";

type PropertiesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(error: string, success: string) {
  if (success === "deleted") {
    return "Объект удалён.";
  }

  return getPropertyNotice(error, success) || getRoomsNotice(error, success);
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await readSearchParams(searchParams);
  const { error, success } = readFeedbackSearchParams(params);
  const data = await getOwnerInventoryDashboardData();

  return <PropertyInventoryBrowser data={data} feedback={getMessage(error, success) || null} />;
}
