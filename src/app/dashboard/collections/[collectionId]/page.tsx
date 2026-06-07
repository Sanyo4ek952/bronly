import { notFound } from "next/navigation";

import { getCollectionDetailData } from "@/entities/collection";
import { CollectionDetailSection } from "@/widgets/collections-dashboard/collection-detail-section";

import {
  addOwnerPropertyToCollectionAction,
  addOwnerRoomToCollectionAction,
  archiveOwnerCollectionAction,
  removeOwnerCollectionItemAction,
  renameOwnerCollectionAction,
} from "../actions";

type CollectionDetailPageProps = {
  params: Promise<{ collectionId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnerCollectionDetailPage({ params, searchParams }: CollectionDetailPageProps) {
  const { collectionId } = await params;
  const fallbackSearchParams: Record<string, string | string[] | undefined> = {};
  const query = await (searchParams ?? Promise.resolve(fallbackSearchParams));
  const success = typeof query.success === "string" ? query.success : "";
  const error = typeof query.error === "string" ? query.error : "";
  const data = await getCollectionDetailData("owner", collectionId);

  if (!data.collection) {
    notFound();
  }

  return (
    <CollectionDetailSection
      title="Коллекция владельца"
      description="Управляйте составом подборки, статистикой и настройками по отдельной странице коллекции."
      backHref="/dashboard/collections"
      data={data}
      renameAction={renameOwnerCollectionAction}
      archiveAction={archiveOwnerCollectionAction}
      addPropertyAction={addOwnerPropertyToCollectionAction}
      addRoomAction={addOwnerRoomToCollectionAction}
      removeItemAction={removeOwnerCollectionItemAction}
      propertyDescription="Владелец может добавлять только свои объекты."
      roomDescription="Номер добавляется отдельно и будет доступен гостю как конкретный вариант."
      success={success}
      error={error}
    />
  );
}
