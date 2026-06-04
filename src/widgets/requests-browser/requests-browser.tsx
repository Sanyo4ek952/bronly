"use client";

import { useState } from "react";

import type { OwnerRequestItem } from "@/entities/request";
import { cn } from "@/shared/lib";
import { Button, Select, StatusPill, Tabs } from "@/shared/ui";

type RequestsBrowserProps = {
  requests: OwnerRequestItem[];
  acceptAction: (formData: FormData) => void | Promise<void>;
  rejectAction: (formData: FormData) => void | Promise<void>;
  completeAction: (formData: FormData) => void | Promise<void>;
};

type RequestStatusFilter = OwnerRequestItem["status"] | "all";

const requestStatuses = [
  { label: "Р’СЃРµ", value: "all" },
  { label: "РќРѕРІС‹Рµ", value: "new" },
  { label: "РџРµСЂРµРґР°РЅС‹ РІР»Р°РґРµР»СЊС†Сѓ", value: "transferred_to_owner" },
  { label: "РџСЂРёРЅСЏС‚С‹ РІР»Р°РґРµР»СЊС†РµРј", value: "accepted_by_owner" },
  { label: "РћС‚РєР»РѕРЅРµРЅРЅС‹Рµ", value: "rejected" },
  { label: "Р—Р°РІРµСЂС€РµРЅРЅС‹Рµ", value: "completed" },
] as const;

function getRequestStatusVariant(status: OwnerRequestItem["status"]) {
  switch (status) {
    case "accepted_by_owner":
      return "accepted_by_owner" as const;
    case "rejected":
      return "rejected" as const;
    case "transferred_to_owner":
      return "transferred_to_owner" as const;
    case "completed":
      return "completed" as const;
    default:
      return "new" as const;
  }
}

function getRequestStatusLabel(status: OwnerRequestItem["status"]) {
  switch (status) {
    case "accepted_by_owner":
      return "РџСЂРёРЅСЏС‚Р° РІР»Р°РґРµР»СЊС†РµРј";
    case "rejected":
      return "РћС‚РєР»РѕРЅРµРЅР°";
    case "transferred_to_owner":
      return "РџРµСЂРµРґР°РЅР° РІР»Р°РґРµР»СЊС†Сѓ";
    case "completed":
      return "Р—Р°РІРµСЂС€РµРЅР°";
    default:
      return "РќРѕРІР°СЏ";
  }
}

function getRequestSourceLabel(source: OwnerRequestItem["source"]) {
  switch (source) {
    case "agent":
      return "РђРіРµРЅС‚СЃРєР°СЏ СЃСЃС‹Р»РєР°";
    case "collection":
      return "РљРѕР»Р»РµРєС†РёСЏ";
    default:
      return "РЎСЃС‹Р»РєР° РІР»Р°РґРµР»СЊС†Р°";
  }
}

export function RequestsBrowser({
  requests,
  acceptAction,
  rejectAction,
  completeAction,
}: RequestsBrowserProps) {
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [selectedRoomId, setSelectedRoomId] = useState("all");
  const [preferredActiveRequestId, setPreferredActiveRequestId] = useState(requests[0]?.id ?? "");

  const roomOptions = Array.from(new Map(requests.map((request) => [request.roomId, request.roomTitle])).entries()).map(
    ([roomId, roomTitle]) => ({ value: roomId, label: roomTitle }),
  );

  const filteredRequests = requests.filter((request) => {
    if (statusFilter !== "all" && request.status !== statusFilter) {
      return false;
    }

    if (selectedRoomId !== "all" && request.roomId !== selectedRoomId) {
      return false;
    }

    return true;
  });

  const activeRequestId = filteredRequests.some((request) => request.id === preferredActiveRequestId)
    ? preferredActiveRequestId
    : (filteredRequests[0]?.id ?? "");
  const activeRequest = filteredRequests.find((request) => request.id === activeRequestId) ?? filteredRequests[0];

  return (
    <>
      <div className="br-dashboard-block__header">
        <div>
          <h2>Р—Р°СЏРІРєРё</h2>
          <p>РџСЂРѕСЃРјР°С‚СЂРёРІР°Р№С‚Рµ Р·Р°РїСЂРѕСЃС‹ РЅР° РїСЂРѕР¶РёРІР°РЅРёРµ Рё РІСЂСѓС‡РЅСѓСЋ РѕР±РЅРѕРІР»СЏР№С‚Рµ РёС… СЃС‚Р°С‚СѓСЃ.</p>
        </div>
        <Select
          className="br-select-inline"
          value={selectedRoomId}
          onChange={(event) => setSelectedRoomId(event.target.value)}
          options={[{ value: "all", label: "Р’СЃРµ РЅРѕРјРµСЂР°" }, ...roomOptions]}
        />
      </div>

      <Tabs
        ariaLabel="РЎС‚Р°С‚СѓСЃС‹ Р·Р°СЏРІРѕРє"
        items={requestStatuses.map((item) => ({
          ...item,
          label:
            item.value === "all"
              ? `Р’СЃРµ (${requests.length})`
              : `${item.label} (${requests.filter((request) => request.status === item.value).length})`,
        }))}
        value={statusFilter}
        onChange={(value) => setStatusFilter(value as RequestStatusFilter)}
      />

      {filteredRequests.length === 0 ? (
        <div className="br-empty-state">
          <strong>РџРѕРґС…РѕРґСЏС‰РёС… Р·Р°СЏРІРѕРє РїРѕРєР° РЅРµС‚</strong>
          <p>РџРѕРїСЂРѕР±СѓР№С‚Рµ СЃРјРµРЅРёС‚СЊ С„РёР»СЊС‚СЂ РїРѕ СЃС‚Р°С‚СѓСЃСѓ РёР»Рё РЅРѕРјРµСЂСѓ.</p>
        </div>
      ) : (
        <div className="br-requests-layout">
          <div className="br-requests-list">
            {filteredRequests.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn("br-request-item", item.id === activeRequest?.id && "br-request-item--active")}
                onClick={() => setPreferredActiveRequestId(item.id)}
              >
                <div className="br-request-item__avatar">{item.guestName[0]}</div>
                <div className="br-request-item__body">
                  <strong>{item.guestName}</strong>
                  <span>{item.createdAt}</span>
                  <span>{item.propertyTitle}</span>
                  <span>{item.roomTitle}</span>
                </div>
                <StatusPill variant={getRequestStatusVariant(item.status)}>{getRequestStatusLabel(item.status)}</StatusPill>
              </button>
            ))}
          </div>

          {activeRequest ? (
            <aside className="br-request-detail br-card">
              <div className="br-request-detail__header">
                <div>
                  <h3>{activeRequest.guestName}</h3>
                  <p>{activeRequest.phone}</p>
                </div>
                <StatusPill variant={getRequestStatusVariant(activeRequest.status)}>
                  {getRequestStatusLabel(activeRequest.status)}
                </StatusPill>
              </div>
              <dl className="br-request-detail__grid">
                <div>
                  <dt>РСЃС‚РѕС‡РЅРёРє</dt>
                  <dd>{getRequestSourceLabel(activeRequest.source)}</dd>
                </div>
                <div>
                  <dt>РћР±СЉРµРєС‚</dt>
                  <dd>{activeRequest.propertyTitle}</dd>
                </div>
                <div>
                  <dt>РќРѕРјРµСЂ</dt>
                  <dd>{activeRequest.roomTitle}</dd>
                </div>
                <div>
                  <dt>Р—Р°РµР·Рґ</dt>
                  <dd>{activeRequest.checkIn}</dd>
                </div>
                <div>
                  <dt>Р’С‹РµР·Рґ</dt>
                  <dd>{activeRequest.checkOut}</dd>
                </div>
                <div>
                  <dt>Р“РѕСЃС‚Рё</dt>
                  <dd>{activeRequest.guestsLabel}</dd>
                </div>
                <div>
                  <dt>РљРѕРјРЅР°С‚</dt>
                  <dd>{activeRequest.roomsCount}</dd>
                </div>
                <div>
                  <dt>РљРѕРјРјРµРЅС‚Р°СЂРёР№</dt>
                  <dd>{activeRequest.comment || "Р‘РµР· РєРѕРјРјРµРЅС‚Р°СЂРёСЏ"}</dd>
                </div>
                <div>
                  <dt>РЎСѓРјРјР°</dt>
                  <dd>{activeRequest.totalPrice.toLocaleString("ru-RU")} в‚Ѕ</dd>
                </div>
                <div>
                  <dt>Р¦РµРЅР° РІ Р·Р°СЏРІРєРµ</dt>
                  <dd>{`${activeRequest.quotedPricePerNight.toLocaleString("ru-RU")} в‚Ѕ / РЅРѕС‡СЊ`}</dd>
                </div>
                <div>
                  <dt>Р‘Р°Р·РѕРІР°СЏ С†РµРЅР° РЅРѕРјРµСЂР°</dt>
                  <dd>{`${activeRequest.basePricePerNight.toLocaleString("ru-RU")} в‚Ѕ / РЅРѕС‡СЊ`}</dd>
                </div>
              </dl>
              {activeRequest.status === "accepted_by_owner" && activeRequest.completionRequestedAt ? (
                <p className="br-inline-notice br-inline-notice--soft" style={{ marginTop: 18 }}>
                  РђРіРµРЅС‚ РїСЂРѕСЃРёС‚ РѕС‚РјРµС‚РёС‚СЊ СЌС‚Сѓ Р·Р°СЏРІРєСѓ Р·Р°РІРµСЂС€РµРЅРЅРѕР№.
                </p>
              ) : null}
              <div className="br-request-detail__actions">
                {activeRequest.status === "new" || activeRequest.status === "transferred_to_owner" ? (
                  <form action={acceptAction}>
                    <input type="hidden" name="requestId" value={activeRequest.id} />
                    <Button fullWidth type="submit">
                      РџСЂРёРЅСЏС‚СЊ РІР»Р°РґРµР»СЊС†РµРј
                    </Button>
                  </form>
                ) : null}
                {activeRequest.status === "accepted_by_owner" ? (
                  <form action={completeAction}>
                    <input type="hidden" name="requestId" value={activeRequest.id} />
                    <Button fullWidth type="submit">
                      РћС‚РјРµС‚РёС‚СЊ Р·Р°РІРµСЂС€РµРЅРЅРѕР№
                    </Button>
                  </form>
                ) : null}
                {activeRequest.status !== "completed" && activeRequest.status !== "rejected" ? (
                  <form action={rejectAction}>
                    <input type="hidden" name="requestId" value={activeRequest.id} />
                    <Button variant="danger" fullWidth type="submit">
                      РћС‚РєР»РѕРЅРёС‚СЊ
                    </Button>
                  </form>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </>
  );
}
