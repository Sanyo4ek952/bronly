import { getCollectionListData } from "@/entities/collection";
import { CollectionListSection } from "@/widgets/collections-dashboard/collection-list-section";

export default async function AgentCollectionsPage() {
  const data = await getCollectionListData("agent");

  return (
    <CollectionListSection
      title="Коллекции агента"
      description="Собирайте номера и объекты в персональные подборки для гостя в рамках активных сотрудничеств."
      collections={data.collections}
      createHref="/agent/dashboard/collections/new"
      detailHrefBase="/agent/dashboard/collections"
      emptyTitle="Пока нет коллекций"
      emptyDescription="Создайте первую подборку, чтобы быстро собирать варианты для гостя."
    />
  );
}
