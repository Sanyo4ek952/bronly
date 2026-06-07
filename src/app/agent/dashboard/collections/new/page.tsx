import { CollectionCreateSection } from "@/widgets/collections-dashboard/collection-create-section";

import { createAgentCollectionAction } from "../actions";

type CollectionCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AgentCollectionCreatePage({ searchParams }: CollectionCreatePageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <CollectionCreateSection
      title="Создать коллекцию агента"
      description="Создайте новую подборку и сразу перейдите к управлению ее составом и ссылкой."
      fieldPlaceholder="Например, для Ольги"
      backHref="/agent/dashboard/collections"
      action={createAgentCollectionAction}
      success={success}
      error={error}
    />
  );
}
