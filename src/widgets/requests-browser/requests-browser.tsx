"use client";

import { useState } from "react";

import type { OwnerRequestItem } from "@/entities/request";
import { formatRubles, toPhoneHref, toWhatsAppHref } from "@/shared/lib";
import { BottomSheet, Button, ButtonLink, InlineNotice, Panel, Select, StatusPill, Tabs } from "@/shared/ui";

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

function isRequestStatusFilter(value: string): value is RequestStatusFilter {
  return requestStatuses.some((item) => item.value === value);
}

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
    <div className="grid gap-2 sm:grid-cols-2">
      {request.status === "new" || request.status === "transferred_to_owner" ? (
        <form action={acceptAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit" size={size} fullWidth>
            Принять владельцем
          </Button>
        </form>
      ) : null}

      {request.status === "accepted_by_owner" ? (
        <form action={completeAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit" size={size} fullWidth>
            Отметить завершенной
          </Button>
        </form>
      ) : null}

      {request.status !== "completed" && request.status !== "rejected" ? (
        <form action={rejectAction}>
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
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--text)]">{request.guestName}</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{request.phone}</p>
        </div>
        <StatusPill variant={getRequestStatusVariant(request.status)}>{getRequestStatusLabel(request.status)}</StatusPill>
      </div>

      <dl className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1 [&>div]:grid [&>div]:gap-1 [&>div]:rounded-2xl [&>div]:bg-[var(--surface-subtle)] [&>div]:p-3 [&_dd]:text-sm [&_dd]:font-semibold [&_dt]:text-xs [&_dt]:text-[var(--text-muted)]">
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
          <dd>{formatRubles(request.totalPrice)}</dd>
        </div>
        <div>
          <dt>Цена в заявке</dt>
          <dd>{`${formatRubles(request.quotedPricePerNight)} / ночь`}</dd>
        </div>
        <div>
          <dt>Базовая цена номера</dt>
          <dd>{`${formatRubles(request.basePricePerNight)} / ночь`}</dd>
        </div>
      </dl>

      {request.status === "accepted_by_owner" && request.completionRequestedAt ? (
        <InlineNotice tone="soft">
          Агент просит отметить эту заявку завершенной.
        </InlineNotice>
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
      <div className="grid min-w-0 gap-1.5">
        <h2 className="text-[var(--section-title-size)] leading-[1.12] tracking-[-0.03em]">Заявки</h2>
        <p className="max-w-[68ch] text-[13px] leading-[1.55] text-[var(--text-muted)]">Просматривайте запросы на проживание и вручную обновляйте их статус.</p>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-end">
        <Tabs
          ariaLabel="Статусы заявок"
          className="overflow-x-auto flex-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>button]:whitespace-nowrap"
          items={requestStatuses.map((item) => ({
            ...item,
            label:
              item.value === "all"
                ? `Все (${requestsForCounts.length})`
                : `${item.label} (${requestsForCounts.filter((request) => request.status === item.value).length})`,
          }))}
          value={statusFilter}
          onChange={(value) => {
            if (isRequestStatusFilter(value)) {
              setStatusFilter(value);
            }
          }}
        />

        <Select
          className="min-h-10"
          value={selectedRoomId}
          onChange={(event) => setSelectedRoomId(event.target.value)}
          options={[{ value: "all", label: "Все номера" }, ...roomOptions]}
        />
      </div>

      {filteredRequests.length === 0 ? (
        <Panel className="grid gap-1.5 p-5 text-center" padding="none" surface="subtle">
          <strong>Подходящих заявок пока нет</strong>
          <p className="text-sm text-[var(--text-muted)]">Попробуйте сменить фильтр по статусу или номеру.</p>
        </Panel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="grid gap-3">
            {filteredRequests.map((item) => {
              const telHref = toPhoneHref(item.phone);
              const whatsappHref = toWhatsAppHref(item.phone);

              return (
                <Panel key={item.id} as="article" className="overflow-hidden shadow-[var(--shadow-sm)]">
                  <button
                    type="button"
                    className="grid w-full gap-3 bg-transparent p-4 text-left text-inherit transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[rgb(var(--color-primary-rgb)_/_0.12)]"
                    onClick={() => setPreferredActiveRequestId(item.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] font-extrabold text-[var(--color-primary-hover)]">{getInitial(item.guestName)}</div>
                        <div className="grid min-w-0 gap-0.5">
                          <strong>{item.guestName}</strong>
                          <span className="text-sm text-[var(--text-muted)]">{item.phone}</span>
                        </div>
                      </div>
                      <StatusPill variant={getRequestStatusVariant(item.status)}>{getRequestStatusLabel(item.status)}</StatusPill>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
                      <div className="grid gap-1">
                        <span>Даты</span>
                        <strong>{`${item.checkIn} - ${item.checkOut}`}</strong>
                      </div>
                      <div className="grid gap-1">
                        <span>Номер</span>
                        <strong>{item.roomTitle}</strong>
                      </div>
                      <div className="grid gap-1">
                        <span>Сумма</span>
                        <strong>{formatRubles(item.totalPrice)}</strong>
                      </div>
                      <div className="grid gap-1">
                        <span>Источник</span>
                        <strong>{getRequestSourceLabel(item.source)}</strong>
                      </div>
                    </div>

                    <p className="text-sm text-[var(--text-muted)]">{getPropertyLabel(item.propertyTitle)}</p>
                  </button>

                  <div className="grid gap-3 border-t border-[var(--border)] p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="flex flex-wrap gap-2">
                      {telHref ? (
                        <ButtonLink href={telHref} variant="secondary" size="sm">
                          Позвонить
                        </ButtonLink>
                      ) : null}
                      {whatsappHref ? (
                        <ButtonLink
                          href={whatsappHref}
                          variant="secondary"
                          size="sm"
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </ButtonLink>
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
                </Panel>
              );
            })}
          </div>

          {activeRequest ? (
            <Panel as="aside" className="sticky top-4 hidden p-4 xl:block" padding="none">
              <RequestDetail
                request={activeRequest}
                acceptAction={acceptAction}
                rejectAction={rejectAction}
                completeAction={completeAction}
              />
            </Panel>
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
        bodyClassName="pb-1"
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
