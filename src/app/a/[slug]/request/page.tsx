import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getPublicAgentPageData } from "@/entities/collaboration";
import { GuestRequestForm } from "@/features/request/submit-request";
import { getPublicUnavailableContent } from "@/shared/lib/public-page-visibility";
import { ButtonLink, Panel } from "@/shared/ui";

import { submitAgentGuestRequestAction } from "./actions";

type AgentRequestPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchString(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function getErrorText(error: string) {
  switch (error) {
    case "room":
      return "Р’С‹Р±СЂР°РЅРЅС‹Р№ РЅРѕРјРµСЂ Р±РѕР»СЊС€Рµ РЅРµРґРѕСЃС‚СѓРїРµРЅ. РџСЂРѕРІРµСЂСЊС‚Рµ РЅРѕРјРµСЂ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.";
    case "availability":
      return "РќР° РІС‹Р±СЂР°РЅРЅС‹Рµ РґР°С‚С‹ Сѓ РЅРѕРјРµСЂР° РµСЃС‚СЊ Р·Р°РЅСЏС‚С‹Рµ РґР°С‚С‹. Р’С‹Р±РµСЂРёС‚Рµ РґСЂСѓРіРѕР№ РїРµСЂРёРѕРґ РёР»Рё РЅРѕРјРµСЂ.";
    case "property":
      return "РћР±СЉРµРєС‚ Р±РѕР»СЊС€Рµ РЅРµРґРѕСЃС‚СѓРїРµРЅ РїРѕ СЌС‚РѕР№ СЃСЃС‹Р»РєРµ.";
    case "subscription":
      return "Р”РѕСЃС‚СѓРї Рє Р°РіРµРЅС‚СЃРєРѕР№ РІРёС‚СЂРёРЅРµ РІСЂРµРјРµРЅРЅРѕ РѕРіСЂР°РЅРёС‡РµРЅ. РќРѕРІС‹Рµ Р·Р°СЏРІРєРё СЃРµР№С‡Р°СЃ РЅРµ РїСЂРёРЅРёРјР°СЋС‚СЃСЏ.";
    case "validation":
      return "РџСЂРѕРІРµСЂСЊС‚Рµ РёРјСЏ, С‚РµР»РµС„РѕРЅ, РЅРѕРјРµСЂ Рё РґР°С‚С‹ РїСЂРѕР¶РёРІР°РЅРёСЏ.";
    default:
      return "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ. РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕР»СЏ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р·.";
  }
}

export default async function AgentRequestPage({ params, searchParams }: AgentRequestPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, query] = await Promise.all([params, searchParams ?? Promise.resolve(fallbackParams)]);
  const propertySlug = getSearchString(query, "propertySlug");
  const pageData = await getPublicAgentPageData(slug, {
    checkIn: getSearchString(query, "checkIn"),
    checkOut: getSearchString(query, "checkOut"),
    adults: getSearchString(query, "adults"),
    rooms: getSearchString(query, "rooms"),
  });

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
    redirect(`/a/${pageData.agent.publicId}/request${suffix ? `?${suffix}` : ""}`);
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

  const selectedSection =
    pageData.properties.find((property) => property.property.slug === propertySlug) ?? pageData.properties[0];

  if (!selectedSection) {
    notFound();
  }

  const requestedError = getSearchString(query, "error");
  const requestedRoomId = getSearchString(query, "roomId");
  const activeRooms = selectedSection.rooms.filter((room) => room.status === "active");
  const hasRequestedRoom = Boolean(requestedRoomId);
  const requestedRoomIsValid = hasRequestedRoom ? activeRooms.some((room) => room.id === requestedRoomId) : true;
  const defaultRoomId =
    (requestedRoomIsValid ? activeRooms.find((room) => room.id === requestedRoomId)?.id : undefined) ??
    activeRooms.find((room) => room.isAvailableForFilter)?.id ??
    activeRooms[0]?.id ??
    "";
  const error = requestedError || (!requestedRoomIsValid ? "room" : "");

  if (!activeRooms.length) {
    return (
      <main className="br-auth-page">
        <Panel className="br-request-success" as="section">
          <h1>Р вЂ”Р В°РЎРЏР Р†Р С”Р В° Р Р†РЎР‚Р ВµР СР ВµР Р…Р Р…Р С• Р Р…Р ВµР Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р Р…Р В°</h1>
          <p>Р СџР С• РЎРЊРЎвЂљР С•Р СРЎС“ Р С•Р В±РЎР‰Р ВµР С”РЎвЂљРЎС“ РЎРѓР ВµР в„–РЎвЂЎР В°РЎРѓ Р Р…Р ВµРЎвЂљ Р В°Р С”РЎвЂљР С‘Р Р†Р Р…РЎвЂ№РЎвЂ¦ Р Р…Р С•Р СР ВµРЎР‚Р С•Р Р† Р Т‘Р В»РЎРЏ Р В·Р В°Р С—РЎР‚Р С•РЎРѓР В° Р Р…Р В° Р С—РЎР‚Р С•Р В¶Р С‘Р Р†Р В°Р Р…Р С‘Р Вµ.</p>
          <div className="br-request-success__actions">
            <ButtonLink href={`/a/${pageData.agent.publicId}`} fullWidth>
              Р вЂ™Р ВµРЎР‚Р Р…РЎС“РЎвЂљРЎРЉРЎРѓРЎРЏ Р С” Р Р†Р С‘РЎвЂљРЎР‚Р С‘Р Р…Р Вµ
            </ButtonLink>
          </div>
        </Panel>
      </main>
    );
  }

  return (
    <main className="br-auth-page">
      <Panel className="br-request-modal" as="section">
        <div className="br-request-modal__header">
          <div>
            <h1>РћСЃС‚Р°РІРёС‚СЊ Р·Р°СЏРІРєСѓ</h1>
            <p>РђРіРµРЅС‚ РїРѕР»СѓС‡РёС‚ РІР°С€ Р·Р°РїСЂРѕСЃ Рё РІСЂСѓС‡РЅСѓСЋ РїРµСЂРµРґР°СЃС‚ РµРіРѕ РІР»Р°РґРµР»СЊС†Сѓ РґР»СЏ СѓС‚РѕС‡РЅРµРЅРёСЏ РґРѕСЃС‚СѓРїРЅРѕСЃС‚Рё.</p>
          </div>
          <Link href={`/a/${pageData.agent.publicId}`} className="br-request-modal__close" aria-label="Р—Р°РєСЂС‹С‚СЊ">
            x
          </Link>
        </div>

        {error ? (
          <p className="br-card" style={{ marginBottom: 16, padding: 16 }}>
            {getErrorText(error)}
          </p>
        ) : null}

        {pageData.publicWarningText ? <p className="br-inline-notice">{pageData.publicWarningText}</p> : null}

        <GuestRequestForm
          propertySlug={selectedSection.property.slug}
          rooms={selectedSection.rooms}
          defaultRoomId={defaultRoomId}
          filters={pageData.filters}
          action={submitAgentGuestRequestAction}
          hiddenFields={[{ name: "agentPublicId", value: pageData.agent.publicId }]}
        />
      </Panel>
    </main>
  );
}
