"use client";

import { useState } from "react";

import type { OwnerRequestItem } from "@/entities/request";
import { cn } from "@/shared/lib";
import { Button, Select, StatusPill, Tabs } from "@/shared/ui";

type RequestRoom = {
  id: string;
  title: string;
  pricePerNight: number;
};

type RequestsBrowserProps = {
  requests: OwnerRequestItem[];
  rooms: RequestRoom[];
};

type RequestStatusFilter = OwnerRequestItem["status"] | "all";

const requestStatuses = [
  { label: "Все", value: "all" },
  { label: "Новые", value: "new" },
  { label: "В работе", value: "in_progress" },
  { label: "Подтвержденные", value: "confirmed" },
  { label: "Отклоненные", value: "declined" },
] as const;

function getRequestStatusVariant(status: OwnerRequestItem["status"]) {
  switch (status) {
    case "new":
      return "new" as const;
    case "in_progress":
      return "in_progress" as const;
    case "confirmed":
      return "confirmed" as const;
    case "declined":
      return "declined" as const;
  }
}

function getRequestStatusLabel(status: OwnerRequestItem["status"]) {
  switch (status) {
    case "in_progress":
      return "В работе";
    case "confirmed":
      return "Подтверждена";
    case "declined":
      return "Отклонена";
    default:
      return "Новая";
  }
}

export function RequestsBrowser({ requests, rooms }: RequestsBrowserProps) {
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [selectedRoomId, setSelectedRoomId] = useState("all");
  const [preferredActiveRequestId, setPreferredActiveRequestId] = useState(requests[0]?.id ?? "");

  const roomLookup = new Map(rooms.map((room) => [room.id, room]));
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
  const activeRoom = activeRequest ? roomLookup.get(activeRequest.roomId) : undefined;

  return (
    <>
      <div className="br-dashboard-block__header">
        <div>
          <h2>Заявки</h2>
          <p>Просматривайте новые запросы и вручную управляйте статусами.</p>
        </div>
        <Select
          className="br-select-inline"
          value={selectedRoomId}
          onChange={(event) => setSelectedRoomId(event.target.value)}
          options={[
            { value: "all", label: "Все номера" },
            ...rooms.map((room) => ({ value: room.id, label: room.title })),
          ]}
        />
      </div>

      <Tabs
        ariaLabel="Статусы заявок"
        items={requestStatuses.map((item) => ({
          ...item,
          label:
            item.value === "all"
              ? `Все (${requests.length})`
              : `${item.label} (${requests.filter((request) => request.status === item.value).length})`,
        }))}
        value={statusFilter}
        onChange={(value) => setStatusFilter(value as RequestStatusFilter)}
      />

      {filteredRequests.length === 0 ? (
        <div className="br-empty-state">
          <strong>Подходящих заявок пока нет</strong>
          <p>Попробуйте сменить фильтр по статусу или номеру.</p>
        </div>
      ) : (
        <div className="br-requests-layout">
          <div className="br-requests-list">
            {filteredRequests.map((item) => {
              const room = roomLookup.get(item.roomId);

              return (
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
                    <span>{room?.title ?? "Номер"}</span>
                  </div>
                  <StatusPill variant={getRequestStatusVariant(item.status)}>
                    {getRequestStatusLabel(item.status)}
                  </StatusPill>
                </button>
              );
            })}
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
                  <dt>Заезд</dt>
                  <dd>{activeRequest.checkIn}</dd>
                </div>
                <div>
                  <dt>Выезд</dt>
                  <dd>{activeRequest.checkOut}</dd>
                </div>
                <div>
                  <dt>Гости</dt>
                  <dd>{activeRequest.guestsLabel}</dd>
                </div>
                <div>
                  <dt>Номер</dt>
                  <dd>{activeRoom?.title ?? "Номер"}</dd>
                </div>
                <div>
                  <dt>Комментарий</dt>
                  <dd>{activeRequest.comment || "Без комментария"}</dd>
                </div>
                <div>
                  <dt>Сумма</dt>
                  <dd>{activeRequest.totalPrice.toLocaleString("ru-RU")} ₽</dd>
                </div>
                {activeRoom ? (
                  <div>
                    <dt>Тариф</dt>
                    <dd>{`от ${activeRoom.pricePerNight.toLocaleString("ru-RU")} ₽ / ночь`}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="br-request-detail__actions">
                <Button fullWidth>Подтвердить</Button>
                <Button variant="secondary" fullWidth>
                  Предложить вариант
                </Button>
                <Button variant="danger" fullWidth>
                  Отклонить
                </Button>
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </>
  );
}
