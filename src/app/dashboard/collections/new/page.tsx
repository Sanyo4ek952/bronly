import { buildOwnerCollectionsBreadcrumbs } from "@/shared/lib";
import { DashboardPageNav } from "@/shared/ui";
import { CollectionCreateSection } from "@/widgets/collections-dashboard/collection-create-section";

import { createOwnerCollectionAction } from "../actions";

type CollectionCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnerCollectionCreatePage({ searchParams }: CollectionCreatePageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <CollectionCreateSection
      title="Создать коллекцию владельца"
      description="Создайте новую подборку и сразу перейдите к управлению ее составом и публичной ссылкой."
      fieldPlaceholder="Например, для Ирины"
      backHref="/dashboard/collections"
      pageNav={(
        <DashboardPageNav
          backHref="/dashboard/collections"
          breadcrumbs={buildOwnerCollectionsBreadcrumbs([{ label: "Новая коллекция" }])}
          compact
        />
      )}
      action={createOwnerCollectionAction}
      success={success}
      error={error}
    />
  );
}
