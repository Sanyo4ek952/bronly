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
  { label: "Все", value: "all" },
  { label: "Новые", value: "new" },
  { label: "Переданы владельцу", value: "transferred_to_owner" },
  { label: "Приняты владельцем", value: "accepted_by_owner" },
  { label: "Отклоненные", value: "rejected" },
  { label: "Завершенные", value: "completed" },
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
      return "Принята владельцем";
    case "rejected":
      return "Отклонена";
    case "transferred_to_owner":
      return "Передана владельцу";
    case "completed":
      return "Завершена";
    default:
      return "Новая";
  }
}

function getRequestSourceLabel(source: OwnerRequestItem["source"]) {
  switch (source) {
    case "agent":
      return "Агентская ссылка";
    case "collection":
      return "Коллекция";
    default:
      return "Ссылка владельца";
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

  const roomOptions = Array.from(
    new Map(requests.map((request) => [request.roomId, request.roomTitle])).entries(),
  ).map(([roomId, roomTitle]) => ({ value: roomId, label: roomTitle }));

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
          <h2>Заявки</h2>
          <p>Просматривайте запросы на проживание и вручную обновляйте их статус.</p>
        </div>
        <Select
          className="br-select-inline"
          value={selectedRoomId}
          onChange={(event) => setSelectedRoomId(event.target.value)}
          options={[{ value: "all", label: "Все номера" }, ...roomOptions]}
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
                </div>
                <StatusPill variant={getRequestStatusVariant(item.status)}>
                  {getRequestStatusLabel(item.status)}
                </StatusPill>
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
                  <dt>Источник</dt>
                  <dd>{getRequestSourceLabel(activeRequest.source)}</dd>
                </div>
                <div>
                  <dt>Объект</dt>
                  <dd>{activeRequest.propertyTitle}</dd>
                </div>
                <div>
                  <dt>Номер</dt>
                  <dd>{activeRequest.roomTitle}</dd>
                </div>
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
                  <dt>Комментарий</dt>
                  <dd>{activeRequest.comment || "Без комментария"}</dd>
                </div>
                <div>
                  <dt>Сумма</dt>
                  <dd>{activeRequest.totalPrice.toLocaleString("ru-RU")} ₽</dd>
                </div>
                <div>
                  <dt>Базовая цена</dt>
                  <dd>{`от ${activeRequest.pricePerNight.toLocaleString("ru-RU")} ₽ / ночь`}</dd>
                </div>
              </dl>
              <div className="br-request-detail__actions">
                {(activeRequest.status === "new" || activeRequest.status === "transferred_to_owner") ? (
                  <form action={acceptAction}>
                    <input type="hidden" name="requestId" value={activeRequest.id} />
                    <Button fullWidth type="submit">Принять владельцем</Button>
                  </form>
                ) : null}
                {activeRequest.status === "accepted_by_owner" ? (
                  <form action={completeAction}>
                    <input type="hidden" name="requestId" value={activeRequest.id} />
                    <Button fullWidth type="submit">Отметить завершенной</Button>
                  </form>
                ) : null}
                {activeRequest.status !== "completed" && activeRequest.status !== "rejected" ? (
                  <form action={rejectAction}>
                    <input type="hidden" name="requestId" value={activeRequest.id} />
                    <Button variant="danger" fullWidth type="submit">
                      Отклонить
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
