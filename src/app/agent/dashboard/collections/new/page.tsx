import { buildAgentCollectionsBreadcrumbs } from "@/shared/lib";
import { DashboardPageNav } from "@/shared/ui";
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
      title="РЎРѕР·РґР°С‚СЊ РєРѕР»Р»РµРєС†РёСЋ Р°РіРµРЅС‚Р°"
      description="РЎРѕР·РґР°Р№С‚Рµ РЅРѕРІСѓСЋ РїРѕРґР±РѕСЂРєСѓ Рё СЃСЂР°Р·Сѓ РїРµСЂРµР№РґРёС‚Рµ Рє СѓРїСЂР°РІР»РµРЅРёСЋ РµРµ СЃРѕСЃС‚Р°РІРѕРј Рё СЃСЃС‹Р»РєРѕР№."
      fieldPlaceholder="РќР°РїСЂРёРјРµСЂ, РґР»СЏ РћР»СЊРіРё"
      backHref="/agent/dashboard/collections"
      pageNav={(
        <DashboardPageNav
          backHref="/agent/dashboard/collections"
          breadcrumbs={buildAgentCollectionsBreadcrumbs([{ label: "Новая коллекция" }])}
          compact
        />
      )}
      action={createAgentCollectionAction}
      success={success}
      error={error}
    />
  );
}
