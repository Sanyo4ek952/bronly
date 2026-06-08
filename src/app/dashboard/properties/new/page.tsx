import Link from "next/link";

import { createOwnerProperty } from "@/app/dashboard/properties/actions";
import { OwnerPropertyFormFields } from "@/features/property/edit-property";
import { buildOwnerInventoryBreadcrumbs } from "@/shared/lib";
import { Button, DashboardPageNav } from "@/shared/ui";

type NewPropertyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(error: string) {
  switch (error) {
    case "validation":
      return "Р—Р°РїРѕР»РЅРёС‚Рµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ РѕР±СЉРµРєС‚Р°.";
    case "duplicate":
      return "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РѕР±СЉРµРєС‚. РџРѕРїСЂРѕР±СѓР№С‚Рµ РёР·РјРµРЅРёС‚СЊ РЅР°Р·РІР°РЅРёРµ.";
    default:
      return error ? "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РѕР±СЉРµРєС‚." : "";
  }
}

export default async function NewPropertyPage({ searchParams }: NewPropertyPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const message = getMessage(error);

  return (
    <section className="br-owner-stack">
      <DashboardPageNav
        backHref="/dashboard/properties"
        breadcrumbs={buildOwnerInventoryBreadcrumbs([{ label: "Новый объект" }])}
        compact
      />

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>РќРѕРІС‹Р№ РѕР±СЉРµРєС‚</h2>
            <p>РЎРѕР·РґР°Р№С‚Рµ РѕР±СЉРµРєС‚ РІР»Р°РґРµР»СЊС†Р° Рё СЃСЂР°Р·Сѓ РїРѕРґРіРѕС‚РѕРІСЊС‚Рµ РµРіРѕ Рє РїСѓР±Р»РёРєР°С†РёРё Рё РїСЂРёС‘РјСѓ Р·Р°СЏРІРѕРє.</p>
          </div>
        </div>

        {message ? <div className="br-inline-notice">{message}</div> : null}

        <form action={createOwnerProperty} className="br-owner-stack">
          <OwnerPropertyFormFields />

          <div className="br-active-step__actions">
            <Link href="/dashboard/properties" className="br-button br-button--secondary">
              Рљ СЃРїРёСЃРєСѓ РѕР±СЉРµРєС‚РѕРІ
            </Link>
            <Button type="submit">РЎРѕР·РґР°С‚СЊ РѕР±СЉРµРєС‚</Button>
          </div>
        </form>
      </section>
    </section>
  );
}
