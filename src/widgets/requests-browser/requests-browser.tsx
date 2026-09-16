"use client";

import { useMemo, useState } from "react";

import type { OwnerRequestItem } from "@/entities/request";
import { cn, formatRubles, toPhoneHref, toWhatsAppHref } from "@/shared/lib";
import { BottomSheet, Button, ButtonLink, InlineNotice, Select, StatusPill, Tabs } from "@/shared/ui";

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
};

const requestStatuses = [
  { label: "Все", mobileLabel: "Все статусы", value: "all" },
  { label: "Новые", mobileLabel: "Новые", value: "new" },
  { label: "Переданы", mobileLabel: "Переданы владельцу", value: "transferred_to_owner" },
  { label: "Приняты", mobileLabel: "Приняты владельцем", value: "accepted_by_owner" },
  { label: "Отклонены", mobileLabel: "Отклонены", value: "rejected" },
  { label: "Завершены", mobileLabel: "Завершены", value: "completed" },
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

function RequestStatusActions({ request, acceptAction, rejectAction, completeAction }: RequestActionProps) {
  const canAccept = request.status === "new" || request.status === "transferred_to_owner";
  const canComplete = request.status === "accepted_by_owner";
  const canReject = request.status !== "completed" && request.status !== "rejected";

  if (!canAccept && !canComplete && !canReject) {
    return null;
  }

  return (
    <div className="grid gap-2 pt-4 sm:grid-cols-2">
      {canAccept ? (
        <form action={acceptAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit" fullWidth>
            Принять владельцем
          </Button>
        </form>
      ) : null}

      {canComplete ? (
        <form action={completeAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit" fullWidth>
            Отметить завершенной
          </Button>
        </form>
      ) : null}

      {canReject ? (
        <form action={rejectAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit" variant="danger" fullWidth>
            Отклонить
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 py-2 text-xs">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="m-0 text-right font-bold text-[var(--text)]">{value}</dd>
    </div>
  );
}

function RequestDetail({
  request,
  acceptAction,
  rejectAction,
  completeAction,
  showIdentity = true,
}: RequestActionProps & { showIdentity?: boolean }) {
  const telHref = toPhoneHref(request.phone);
  const whatsappHref = toWhatsAppHref(request.phone);

  return (
    <div className="grid gap-0">
      {showIdentity ? (
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="min-w-0">
            <h2 className="text-[23px] font-bold leading-[1.15] tracking-[-0.025em] text-[var(--text)]">
              {request.guestName}
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{request.phone}</p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">Получена {request.createdAt}</p>
          </div>
          <StatusPill className="shrink-0" variant={getRequestStatusVariant(request.status)}>
            {getRequestStatusLabel(request.status)}
          </StatusPill>
        </div>
      ) : (
        <StatusPill className="mb-3 justify-self-start" variant={getRequestStatusVariant(request.status)}>
          {getRequestStatusLabel(request.status)}
        </StatusPill>
      )}

      {telHref || whatsappHref ? (
        <div className="grid grid-cols-2 gap-2 border-b border-[var(--border)] py-3.5">
          {telHref ? (
            <ButtonLink href={telHref} variant="secondary" fullWidth>
              Позвонить
            </ButtonLink>
          ) : null}
          {whatsappHref ? (
            <ButtonLink href={whatsappHref} variant="secondary" fullWidth target="_blank" rel="noreferrer">
              WhatsApp
            </ButtonLink>
          ) : null}
        </div>
      ) : null}

      <section className="border-b border-[var(--border)] py-3.5">
        <h3 className="mb-1 text-[10px] font-extrabold tracking-[0.09em] text-[var(--accent-strong)]">
          РАЗМЕЩЕНИЕ
        </h3>
        <dl className="m-0">
          <DetailRow label="Объект" value={getPropertyLabel(request.propertyTitle)} />
          <DetailRow label="Номер" value={request.roomTitle} />
          <DetailRow label="Источник" value={getRequestSourceLabel(request.source)} />
        </dl>
      </section>

      <section className="border-b border-[var(--border)] py-3.5">
        <h3 className="mb-1 text-[10px] font-extrabold tracking-[0.09em] text-[var(--accent-strong)]">
          ПРОЖИВАНИЕ
        </h3>
        <dl className="m-0">
          <DetailRow label="Заезд" value={request.checkIn} />
          <DetailRow label="Выезд" value={request.checkOut} />
          <DetailRow label="Гости" value={request.guestsLabel} />
          <DetailRow label="Комнат" value={request.roomsCount} />
        </dl>
      </section>

      <section className="border-b border-[var(--border)] py-3.5">
        <h3 className="mb-1 text-[10px] font-extrabold tracking-[0.09em] text-[var(--accent-strong)]">
          СТОИМОСТЬ
        </h3>
        <dl className="m-0">
          <DetailRow label="Итого" value={formatRubles(request.totalPrice)} />
          <DetailRow label="Цена в заявке" value={`${formatRubles(request.quotedPricePerNight)} / ночь`} />
          <DetailRow label="Базовая цена" value={`${formatRubles(request.basePricePerNight)} / ночь`} />
        </dl>
      </section>

      <section className="border-b border-[var(--border)] py-3.5">
        <h3 className="mb-2 text-[10px] font-extrabold tracking-[0.09em] text-[var(--accent-strong)]">
          КОММЕНТАРИЙ
        </h3>
        <p className="text-xs leading-[1.55] text-[var(--text-subtle)]">
          {request.comment || "Без комментария"}
        </p>
      </section>

      {request.status === "accepted_by_owner" && request.completionRequestedAt ? (
        <InlineNotice className="mt-4" tone="soft">
          Агент просит отметить эту заявку завершенной.
        </InlineNotice>
      ) : null}

      <RequestStatusActions
        request={request}
        acceptAction={acceptAction}
        rejectAction={rejectAction}
        completeAction={completeAction}
      />
    </div>
  );
}

type RequestListItemProps = {
  request: OwnerRequestItem;
  isActive: boolean;
  onSelect: () => void;
  onOpenDetails: () => void;
};

function RequestListItem({ request, isActive, onSelect, onOpenDetails }: RequestListItemProps) {
  return (
    <article className={cn("border-b border-[var(--border)] last:border-b-0", isActive && "bg-[var(--surface-muted)] shadow-[inset_3px_0_var(--accent)]")}>
      <button
        type="button"
        className={cn(
          "grid w-full grid-cols-[minmax(190px,1.15fr)_minmax(125px,0.75fr)_minmax(150px,0.9fr)_118px] items-center gap-3.5 bg-transparent px-[18px] py-[17px] text-left text-inherit transition-colors",
          "hover:bg-[rgb(var(--color-primary-rgb)_/_0.035)] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]",
          "max-[1240px]:grid-cols-[minmax(180px,1fr)_120px_minmax(140px,0.8fr)]",
          "max-[820px]:grid-cols-[minmax(0,1fr)_auto] max-[820px]:gap-3 max-[820px]:px-3.5 max-[820px]:py-3.5",
          "max-[390px]:px-3",
        )}
        aria-label={`Выбрать заявку: ${request.guestName}`}
        aria-current={isActive ? "true" : undefined}
        onClick={onSelect}
      >
        <span className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)] items-center gap-3 max-[820px]:grid-cols-[38px_minmax(0,1fr)]">
          <span className="grid size-[42px] shrink-0 place-items-center rounded-full bg-[var(--surface-subtle)] font-extrabold text-[var(--accent-strong)] max-[820px]:size-[38px]">
            {getInitial(request.guestName)}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm text-[var(--text)] max-[820px]:whitespace-normal">{request.guestName}</strong>
            <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">{request.phone}</span>
            <StatusPill className="mt-1.5" variant={getRequestStatusVariant(request.status)}>
              {getRequestStatusLabel(request.status)}
            </StatusPill>
          </span>
        </span>

        <span className="min-w-0 max-[820px]:col-span-full">
          <strong className="block text-[13px] text-[var(--text)]">{`${request.checkIn} – ${request.checkOut}`}</strong>
          <span className="mt-1 block text-[11px] text-[var(--text-muted)]">{request.guestsLabel}</span>
        </span>

        <span className="min-w-0 max-[820px]:col-span-full">
          <strong className="block truncate text-[13px] text-[var(--text)] max-[820px]:whitespace-normal">{request.roomTitle}</strong>
          <span className="mt-1 block text-[11px] leading-[1.45] text-[var(--text-muted)]">
            {`${getPropertyLabel(request.propertyTitle)} · ${getRequestSourceLabel(request.source)}`}
          </span>
        </span>

        <span className="min-w-0 text-right max-[1240px]:hidden">
          <strong className="block text-[13px] text-[var(--text)]">{formatRubles(request.totalPrice)}</strong>
          <span className="mt-1 block text-[11px] text-[var(--text-muted)]">{`${formatRubles(request.quotedPricePerNight)} / ночь`}</span>
        </span>
      </button>

      <div className="hidden px-3 pb-3 max-[820px]:block">
        <Button type="button" variant="secondary" fullWidth onClick={onOpenDetails}>
          Подробнее
        </Button>
      </div>
    </article>
  );
}

export function RequestsBrowser({ requests, acceptAction, rejectAction, completeAction }: RequestsBrowserProps) {
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [selectedRoomId, setSelectedRoomId] = useState("all");
  const [preferredActiveRequestId, setPreferredActiveRequestId] = useState(requests[0]?.id ?? "");
  const [sheetRequestId, setSheetRequestId] = useState<string | null>(null);

  const { roomOptions, requestsForCounts, filteredRequests } = useMemo(() => {
    const nextRoomOptions = Array.from(new Map(requests.map((request) => [request.roomId, request.roomTitle])).entries()).map(
      ([roomId, roomTitle]) => ({ value: roomId, label: roomTitle }),
    );
    const nextRequestsForCounts = selectedRoomId === "all"
      ? requests
      : requests.filter((request) => request.roomId === selectedRoomId);
    const nextFilteredRequests = nextRequestsForCounts.filter(
      (request) => statusFilter === "all" || request.status === statusFilter,
    );

    return {
      roomOptions: nextRoomOptions,
      requestsForCounts: nextRequestsForCounts,
      filteredRequests: nextFilteredRequests,
    };
  }, [requests, selectedRoomId, statusFilter]);

  const activeRequestId = filteredRequests.some((request) => request.id === preferredActiveRequestId)
    ? preferredActiveRequestId
    : (filteredRequests[0]?.id ?? "");
  const activeRequest = filteredRequests.find((request) => request.id === activeRequestId) ?? null;
  const sheetRequest = requests.find((request) => request.id === sheetRequestId) ?? null;
  const statusTabItems = requestStatuses.map((item) => ({
    label: `${item.label} · ${item.value === "all" ? requestsForCounts.length : requestsForCounts.filter((request) => request.status === item.value).length}`,
    value: item.value,
  }));
  const statusSelectOptions = requestStatuses.map((item) => ({
    label: `${item.mobileLabel} · ${item.value === "all" ? requestsForCounts.length : requestsForCounts.filter((request) => request.status === item.value).length}`,
    value: item.value,
  }));

  function resetFilters() {
    setStatusFilter("all");
    setSelectedRoomId("all");
  }

  return (
    <>
      <section
        className="grid grid-cols-[minmax(0,1fr)_230px] items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-[11px] shadow-[var(--shadow-sm)] max-[720px]:grid-cols-2 max-[720px]:p-2 max-[390px]:grid-cols-1"
        aria-label="Фильтры заявок"
      >
        <Tabs
          ariaLabel="Статусы заявок"
          className="!mt-0 flex-nowrap overflow-x-auto border-0 bg-transparent p-0 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>button]:shrink-0 [&>button]:whitespace-nowrap max-[720px]:hidden"
          items={statusTabItems}
          value={statusFilter}
          onChange={(value) => {
            if (isRequestStatusFilter(value)) setStatusFilter(value);
          }}
        />
        <Select
          aria-label="Статус заявки"
          wrapperClassName="hidden max-[720px]:grid"
          className="min-h-11 bg-[var(--bg)]"
          value={statusFilter}
          onChange={(event) => {
            if (isRequestStatusFilter(event.target.value)) setStatusFilter(event.target.value);
          }}
          options={statusSelectOptions}
        />
        <Select
          aria-label="Номер"
          className="min-h-11 bg-[var(--bg)]"
          value={selectedRoomId}
          onChange={(event) => setSelectedRoomId(event.target.value)}
          options={[{ value: "all", label: "Все номера" }, ...roomOptions]}
        />
      </section>

      <p className="sr-only" aria-live="polite">
        {`Найдено заявок: ${filteredRequests.length}`}
      </p>

      {filteredRequests.length === 0 ? (
        <section className="grid justify-items-start gap-3 rounded-[22px] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
          <div className="grid gap-1.5">
            <h2 className="text-lg font-bold text-[var(--text)]">Подходящих заявок пока нет</h2>
            <p className="text-sm leading-[1.55] text-[var(--text-muted)]">
              Измените статус или номер, чтобы увидеть другие запросы на проживание.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </section>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-6 max-[1180px]:grid-cols-[minmax(0,1fr)_330px] max-[820px]:block">
          <section className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]" aria-label="Список заявок">
            <div className="grid grid-cols-[minmax(190px,1.15fr)_minmax(125px,0.75fr)_minmax(150px,0.9fr)_118px] gap-3.5 border-b border-[var(--border)] bg-[var(--surface-subtle)] px-[18px] py-3 text-[10px] font-extrabold tracking-[0.06em] text-[var(--text-muted)] max-[1240px]:grid-cols-[minmax(180px,1fr)_120px_minmax(140px,0.8fr)] max-[820px]:hidden">
              <span>ГОСТЬ И СТАТУС</span>
              <span>ДАТЫ</span>
              <span>РАЗМЕЩЕНИЕ</span>
              <span className="text-right max-[1240px]:hidden">СУММА</span>
            </div>
            {filteredRequests.map((request) => (
              <RequestListItem
                key={request.id}
                request={request}
                isActive={request.id === activeRequestId}
                onSelect={() => setPreferredActiveRequestId(request.id)}
                onOpenDetails={() => {
                  setPreferredActiveRequestId(request.id);
                  setSheetRequestId(request.id);
                }}
              />
            ))}
          </section>

          {activeRequest ? (
            <aside className="sticky top-6 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-[21px] shadow-[var(--shadow-md)] max-[820px]:hidden" aria-label="Детали выбранной заявки">
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
          if (!open) setSheetRequestId(null);
        }}
        title={sheetRequest ? sheetRequest.guestName : "Заявка"}
        description={sheetRequest ? `${sheetRequest.phone} · ${sheetRequest.checkIn} – ${sheetRequest.checkOut}` : undefined}
        closeLabel="Закрыть детали заявки"
        bodyClassName="gap-0 pb-1"
        rootClassName="min-[821px]:hidden"
      >
        {sheetRequest ? (
          <RequestDetail
            request={sheetRequest}
            acceptAction={acceptAction}
            rejectAction={rejectAction}
            completeAction={completeAction}
            showIdentity={false}
          />
        ) : null}
      </BottomSheet>
    </>
  );
}
