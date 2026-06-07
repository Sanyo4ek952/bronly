import { notFound } from "next/navigation";

import { getCollectionDetailData } from "@/entities/collection";
import { CollectionDetailSection } from "@/widgets/collections-dashboard/collection-detail-section";

import {
  addAgentPropertyToCollectionAction,
  addAgentRoomToCollectionAction,
  archiveAgentCollectionAction,
  removeAgentCollectionItemAction,
  renameAgentCollectionAction,
} from "../actions";

type CollectionDetailPageProps = {
  params: Promise<{ collectionId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AgentCollectionDetailPage({ params, searchParams }: CollectionDetailPageProps) {
  const { collectionId } = await params;
  const fallbackSearchParams: Record<string, string | string[] | undefined> = {};
  const query = await (searchParams ?? Promise.resolve(fallbackSearchParams));
  const success = typeof query.success === "string" ? query.success : "";
  const error = typeof query.error === "string" ? query.error : "";
  const data = await getCollectionDetailData("agent", collectionId);

  if (!data.collection) {
    notFound();
  }

  return (
    <CollectionDetailSection
      title="Коллекция агента"
      description="Управляйте составом подборки, статистикой и настройками по отдельной странице коллекции."
      backHref="/agent/dashboard/collections"
      data={data}
      renameAction={renameAgentCollectionAction}
      archiveAction={archiveAgentCollectionAction}
      addPropertyAction={addAgentPropertyToCollectionAction}
      addRoomAction={addAgentRoomToCollectionAction}
      removeItemAction={removeAgentCollectionItemAction}
      propertyDescription="Агент может добавлять свои объекты и объекты владельцев только при активном сотрудничестве."
      roomDescription="Доступны свои номера и номера владельцев при активном сотрудничестве."
      success={success}
      error={error}
    />
  );
}
