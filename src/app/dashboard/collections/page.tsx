import { getCollectionListData } from "@/entities/collection";
import { CollectionListSection } from "@/widgets/collections-dashboard/collection-list-section";

export default async function OwnerCollectionsPage() {
  const data = await getCollectionListData("owner");

  return (
    <CollectionListSection
      title="Коллекции"
      description="Собирайте объекты и отдельные номера в персональные подборки и отправляйте гостю одну понятную ссылку."
      collections={data.collections}
      createHref="/dashboard/collections/new"
      detailHrefBase="/dashboard/collections"
      emptyTitle="Пока нет коллекций"
      emptyDescription="Создайте первую подборку, чтобы быстро собирать варианты для гостя."
      layout="owner-list"
    />
  );
}
