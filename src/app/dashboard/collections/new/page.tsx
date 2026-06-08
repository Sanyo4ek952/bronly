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
      title="РЎРѕР·РґР°С‚СЊ РєРѕР»Р»РµРєС†РёСЋ РІР»Р°РґРµР»СЊС†Р°"
      description="РЎРѕР·РґР°Р№С‚Рµ РЅРѕРІСѓСЋ РїРѕРґР±РѕСЂРєСѓ Рё СЃСЂР°Р·Сѓ РїРµСЂРµР№РґРёС‚Рµ Рє СѓРїСЂР°РІР»РµРЅРёСЋ РµРµ СЃРѕСЃС‚Р°РІРѕРј Рё РїСѓР±Р»РёС‡РЅРѕР№ СЃСЃС‹Р»РєРѕР№."
      fieldPlaceholder="РќР°РїСЂРёРјРµСЂ, РґР»СЏ РСЂРёРЅС‹"
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
