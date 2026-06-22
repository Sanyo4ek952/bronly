"use client";

import { useState } from "react";

import type { OwnerRequestItem } from "@/entities/request";
import { toPhoneHref, toWhatsAppHref } from "@/shared/lib";
import { BottomSheet, Button, Select, StatusPill, Tabs } from "@/shared/ui";

type RequestsBrowserProps = {
  requests: OwnerRequestItem[];
  acceptAction: (formData: FormData) => void | Promise<void>;
  rejectAction: (formData: FormData) => void | Promise<void>;
  completeAction: (formData: FormData) => void | Promise<void>;
};

type RequestStatusFilter = OwnerRequestItem["status"] | "all";

type RequestActionProps = {
  request: OwnerRequestItem;
  acceptAction: RequestsBrowserProps["acceptAction"];
  rejectAction: RequestsBrowserProps["rejectAction"];
  completeAction: RequestsBrowserProps["completeAction"];
  compact?: boolean;
};

const requestStatuses = [
  { label: "Все", value: "all" },
  { label: "Новые", value: "new" },
  { label: "Передана владельцу", value: "transferred_to_owner" },
  { label: "Принята владельцем", value: "accepted_by_owner" },
  { label: "Отклонена", value: "rejected" },
  { label: "Завершена", value: "completed" },
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

function getPropertyLabel(propertyTitle: string) {
  const normalized = propertyTitle.trim();

  if (!normalized || normalized === "Объект") {
    return "Отдельный номер";
  }

  return normalized;
}

function getInitial(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed[0]?.toUpperCase() ?? "?" : "?";
}

function RequestStatusActions({
  request,
  acceptAction,
  rejectAction,
  completeAction,
  compact = false,
}: RequestActionProps) {
  const size = compact ? "sm" : "md";

  return (
    <div className="br-request-status-actions">
      {request.status === "new" || request.status === "transferred_to_owner" ? (
        <form action={acceptAction} className="br-request-status-actions__item">
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit" size={size} fullWidth>
            Принять владельцем
          </Button>
        </form>
      ) : null}

      {request.status === "accepted_by_owner" ? (
        <form action={completeAction} className="br-request-status-actions__item">
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit" size={size} fullWidth>
            Отметить завершенной
          </Button>
        </form>
      ) : null}

      {request.status !== "completed" && request.status !== "rejected" ? (
        <form action={rejectAction} className="br-request-status-actions__item">
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit" variant="danger" size={size} fullWidth>
            Отклонить
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function RequestDetail({
  request,
  acceptAction,
  rejectAction,
  completeAction,
  compactActions = false,
}: RequestActionProps & { compactActions?: boolean }) {
  return (
    <div className="br-request-detail">
      <div className="br-request-detail__header">
        <div>
          <h3>{request.guestName}</h3>
          <p>{request.phone}</p>
        </div>
        <StatusPill variant={getRequestStatusVariant(request.status)}>{getRequestStatusLabel(request.status)}</StatusPill>
      </div>

      <dl className="br-request-detail__grid">
        <div>
          <dt>Источник</dt>
          <dd>{getRequestSourceLabel(request.source)}</dd>
        </div>
        <div>
          <dt>Объект</dt>
          <dd>{getPropertyLabel(request.propertyTitle)}</dd>
        </div>
        <div>
          <dt>Номер</dt>
          <dd>{request.roomTitle}</dd>
        </div>
        <div>
          <dt>Заезд</dt>
          <dd>{request.checkIn}</dd>
        </div>
        <div>
          <dt>Выезд</dt>
          <dd>{request.checkOut}</dd>
        </div>
        <div>
          <dt>Гости</dt>
          <dd>{request.guestsLabel}</dd>
        </div>
        <div>
          <dt>Комнат</dt>
          <dd>{request.roomsCount}</dd>
        </div>
        <div>
          <dt>Комментарий</dt>
          <dd>{request.comment || "Без комментария"}</dd>
        </div>
        <div>
          <dt>Сумма</dt>
          <dd>{request.totalPrice.toLocaleString("ru-RU")} ₽</dd>
        </div>
        <div>
          <dt>Цена в заявке</dt>
          <dd>{`${request.quotedPricePerNight.toLocaleString("ru-RU")} ₽ / ночь`}</dd>
        </div>
        <div>
          <dt>Базовая цена номера</dt>
          <dd>{`${request.basePricePerNight.toLocaleString("ru-RU")} ₽ / ночь`}</dd>
        </div>
      </dl>

      {request.status === "accepted_by_owner" && request.completionRequestedAt ? (
        <p className="br-inline-notice br-inline-notice--soft br-request-detail__notice">
          Агент просит отметить эту заявку завершенной.
        </p>
      ) : null}

      <RequestStatusActions
        request={request}
        acceptAction={acceptAction}
        rejectAction={rejectAction}
        completeAction={completeAction}
        compact={compactActions}
      />
    </div>
  );
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
  const [sheetRequestId, setSheetRequestId] = useState<string | null>(null);

  const roomOptions = Array.from(new Map(requests.map((request) => [request.roomId, request.roomTitle])).entries()).map(
    ([roomId, roomTitle]) => ({ value: roomId, label: roomTitle }),
  );

  const requestsForCounts =
    selectedRoomId === "all" ? requests : requests.filter((request) => request.roomId === selectedRoomId);

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
  const activeRequest = filteredRequests.find((request) => request.id === activeRequestId) ?? filteredRequests[0] ?? null;
  const sheetRequest = requests.find((request) => request.id === sheetRequestId) ?? null;

  return (
    <>
      <div className="br-dashboard-block__header">
        <div>
          <h2>Заявки</h2>
          <p>Просматривайте запросы на проживание и вручную обновляйте их статус.</p>
        </div>
      </div>

      <div className="br-request-filters">
        <Tabs
          ariaLabel="Статусы заявок"
          className="br-request-filters__tabs"
          items={requestStatuses.map((item) => ({
            ...item,
            label:
              item.value === "all"
                ? `Все (${requestsForCounts.length})`
                : `${item.label} (${requestsForCounts.filter((request) => request.status === item.value).length})`,
          }))}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as RequestStatusFilter)}
        />

        <Select
          className="br-select-inline br-request-filters__select"
          value={selectedRoomId}
          onChange={(event) => setSelectedRoomId(event.target.value)}
          options={[{ value: "all", label: "Все номера" }, ...roomOptions]}
        />
      </div>

      {filteredRequests.length === 0 ? (
        <div className="br-empty-state">
          <strong>Подходящих заявок пока нет</strong>
          <p>Попробуйте сменить фильтр по статусу или номеру.</p>
        </div>
      ) : (
        <div className="br-requests-layout">
          <div className="br-request-cards">
            {filteredRequests.map((item) => {
              const telHref = toPhoneHref(item.phone);
              const whatsappHref = toWhatsAppHref(item.phone);

              return (
                <article key={item.id} className="br-request-card br-card">
                  <button
                    type="button"
                    className="br-request-card__summary"
                    onClick={() => setPreferredActiveRequestId(item.id)}
                  >
                    <div className="br-request-card__summary-top">
                      <div className="br-request-card__identity">
                        <div className="br-request-card__avatar">{getInitial(item.guestName)}</div>
                        <div className="br-request-card__identity-copy">
                          <strong>{item.guestName}</strong>
                          <span>{item.phone}</span>
                        </div>
                      </div>
                      <StatusPill variant={getRequestStatusVariant(item.status)}>{getRequestStatusLabel(item.status)}</StatusPill>
                    </div>

                    <div className="br-request-card__summary-grid">
                      <div className="br-request-card__fact">
                        <span>Даты</span>
                        <strong>{`${item.checkIn} - ${item.checkOut}`}</strong>
                      </div>
                      <div className="br-request-card__fact">
                        <span>Номер</span>
                        <strong>{item.roomTitle}</strong>
                      </div>
                      <div className="br-request-card__fact">
                        <span>Сумма</span>
                        <strong>{item.totalPrice.toLocaleString("ru-RU")} ₽</strong>
                      </div>
                      <div className="br-request-card__fact">
                        <span>Источник</span>
                        <strong>{getRequestSourceLabel(item.source)}</strong>
                      </div>
                    </div>

                    <p className="br-request-card__subtitle">{getPropertyLabel(item.propertyTitle)}</p>
                  </button>

                  <div className="br-request-card__actions">
                    <div className="br-request-card__contact-actions">
                      {telHref ? (
                        <a href={telHref} className="br-button br-button--secondary br-button--sm">
                          Позвонить
                        </a>
                      ) : null}
                      {whatsappHref ? (
                        <a
                          href={whatsappHref}
                          className="br-button br-button--secondary br-button--sm"
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreferredActiveRequestId(item.id);
                          setSheetRequestId(item.id);
                        }}
                      >
                        Подробнее
                      </Button>
                    </div>

                    <RequestStatusActions
                      request={item}
                      acceptAction={acceptAction}
                      rejectAction={rejectAction}
                      completeAction={completeAction}
                      compact
                    />
                  </div>
                </article>
              );
            })}
          </div>

          {activeRequest ? (
            <aside className="br-request-detail-panel br-card">
              <RequestDetail
                request={activeRequest}
                acceptAction={acceptAction}
                rejectAction={rejectAction}
                completeAction={completeAction}
              />
            </aside>
          ) : null}
        </div>
      )}

      <BottomSheet
        open={sheetRequest != null}
        onOpenChange={(open) => {
          if (!open) {
            setSheetRequestId(null);
          }
        }}
        title={sheetRequest ? sheetRequest.guestName : "Заявка"}
        description={sheetRequest ? `${sheetRequest.checkIn} - ${sheetRequest.checkOut}` : undefined}
        closeLabel="Закрыть детали заявки"
        bodyClassName="br-request-sheet__body"
      >
        {sheetRequest ? (
          <RequestDetail
            request={sheetRequest}
            acceptAction={acceptAction}
            rejectAction={rejectAction}
            completeAction={completeAction}
            compactActions
          />
        ) : null}
      </BottomSheet>
    </>
  );
}
