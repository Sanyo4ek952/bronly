import Link from "next/link";
import { CircleCheckBig } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { AppIcon, ButtonLink, Panel } from "@/shared/ui";

type AgentRequestSuccessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AgentRequestSuccessPage({ params, searchParams }: AgentRequestSuccessPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const propertySlug = getSearchString(query, "propertySlug");
  const roomId = getSearchString(query, "roomId");
  const pageData = await getPublicAgentPageData(slug);

  if (!pageData) {
    notFound();
  }

  if (pageData.shouldRedirectToCanonical && pageData.agent?.publicId) {
    const redirectQuery = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string") {
        redirectQuery.set(key, value);
      }
    }

    const suffix = redirectQuery.toString();
    redirect(`/a/${pageData.agent.publicId}/request/success${suffix ? `?${suffix}` : ""}`);
  }

  if (pageData.publicUnavailableReason || !pageData.agent) {
    const unavailable = getPublicUnavailableContent("agent", pageData.publicUnavailableReason);

    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>{unavailable.title}</h1>
          <p>{unavailable.description}</p>
          <div className="br-request-success__actions">
            <ButtonLink href="/" fullWidth>
              РќР° РіР»Р°РІРЅСѓСЋ
            </ButtonLink>
          </div>
        </Panel>
      </main>
    );
  }

  const selectedSection = pageData.properties.find((property) => property.property.slug === propertySlug) ?? pageData.properties[0];
  const selectedRoom = selectedSection?.rooms.find((room) => room.id === roomId) ?? null;
  const roomSummary = selectedSection && selectedRoom ? `${selectedSection.property.shortTitle} - ${selectedRoom.title}` : "РІС‹Р±СЂР°РЅРЅС‹Р№ РЅРѕРјРµСЂ";

  return (
    <main className="br-auth-page">
      <Panel className="br-request-success" as="section">
        <div className="br-request-success__icon" aria-hidden="true">
          <AppIcon icon={CircleCheckBig} />
        </div>
        <h1>Р—Р°СЏРІРєР° РѕС‚РїСЂР°РІР»РµРЅР°</h1>
        <p>
          Р—Р°СЏРІРєР° РЅР° {roomSummary} РѕС‚РїСЂР°РІР»РµРЅР°. РђРіРµРЅС‚ {pageData.agent.displayName} РїРѕР»СѓС‡РёР» РІР°С€ Р·Р°РїСЂРѕСЃ РЅР° РїСЂРѕР¶РёРІР°РЅРёРµ Рё РїСЂРё
          РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё РїРµСЂРµРґР°СЃС‚ РµРіРѕ РІР»Р°РґРµР»СЊС†Сѓ, С‡С‚РѕР±С‹ СѓС‚РѕС‡РЅРёС‚СЊ РґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊ.
          {pageData.agent.phone ? ` Р РµРєРѕРјРµРЅРґСѓРµРј СЃРѕС…СЂР°РЅРёС‚СЊ РЅРѕРјРµСЂ ${pageData.agent.phone}.` : ""}
        </p>
        <div className="br-request-success__actions">
          <ButtonLink href={`/a/${pageData.agent.publicId}`} fullWidth>
            Р’РµСЂРЅСѓС‚СЊСЃСЏ Рє РІРёС‚СЂРёРЅРµ
          </ButtonLink>
          <Link href="/" className="br-button br-button--secondary br-button--full">
            РќР° РіР»Р°РІРЅСѓСЋ
          </Link>
        </div>
      </Panel>
    </main>
  );
}
