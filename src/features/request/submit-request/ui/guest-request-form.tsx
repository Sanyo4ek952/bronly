"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { buildPublicRoomQuote, normalizePublicStayFilters, type PublicStayFilters } from "@/entities/room/model/pricing";
import type { PublicRoom } from "@/entities/room/model/types";
import { InlineNotice, Input, Panel, Select, SubmitButton, Textarea } from "@/shared/ui";

import { buildPublicRequestSummary } from "../model/public-request-ui";

type GuestRequestFormProps = {
  publicSlug?: string;
  propertySlug?: string;
  rooms: PublicRoom[];
  defaultRoomId: string;
  filters: PublicStayFilters;
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Array<{ name: string; value: string }>;
  contextMessage: string;
  errorMessage?: string;
  propertyTitle?: string;
  roomFieldHint?: string;
  headingEyebrow?: string;
};

export function GuestRequestForm({
  publicSlug,
  propertySlug,
  rooms,
  defaultRoomId,
  filters,
  action,
  hiddenFields = [],
  contextMessage,
  errorMessage,
  propertyTitle,
  roomFieldHint = "Заявка будет отправлена только по выбранному номеру.",
  headingEyebrow = "Выбранный номер",
}: GuestRequestFormProps) {
  const activeRooms = useMemo(() => rooms.filter((room) => room.status === "active"), [rooms]);
  const [selectedRoomId, setSelectedRoomId] = useState(defaultRoomId);
  const [checkIn, setCheckIn] = useState(filters.checkIn);
  const [checkOut, setCheckOut] = useState(filters.checkOut);
  const [adultsCount, setAdultsCount] = useState(String(filters.adults));
  const [roomsCount, setRoomsCount] = useState(String(filters.rooms));

  const selectedRoom = activeRooms.find((room) => room.id === selectedRoomId) ?? activeRooms[0];
  const summaryFilters = normalizePublicStayFilters({
    checkIn,
    checkOut,
    adults: adultsCount,
    rooms: roomsCount,
  });
  const quotedRoom = selectedRoom ? buildPublicRoomQuote(selectedRoom, summaryFilters) : null;
  const summary = quotedRoom ? buildPublicRequestSummary(quotedRoom, summaryFilters, propertyTitle) : null;

  return (
    <form className="grid gap-4" action={action}>
      {publicSlug ? <input type="hidden" name="publicSlug" value={publicSlug} /> : null}
      {propertySlug ? <input type="hidden" name="propertySlug" value={propertySlug} /> : null}
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}

      {summary ? (
        <section className="grid gap-4">
          <Panel className="grid gap-0 overflow-hidden border-[var(--color-border)] bg-[rgb(255_255_255_/_0.82)]" padding="md">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#e3dccf_0%,#c4d4c7_52%,#f1e7d8_100%)]">
              {summary.imageUrl ? (
                <Image
                  src={summary.imageUrl}
                  alt={summary.roomTitle}
                  width={1200}
                  height={800}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full" aria-hidden="true" />
              )}
            </div>
            <div className="grid gap-4 pt-4">
              <span className="text-xs font-extrabold uppercase tracking-[0.04em] text-[var(--color-primary-hover)]">{headingEyebrow}</span>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div>
                  <h2 className="text-[22px] font-extrabold leading-tight">{summary.roomTitle}</h2>
                  {summary.propertyTitle ? <p className="mt-1 text-sm text-[var(--color-muted)]">{summary.propertyTitle}</p> : null}
                </div>
                <div className="grid gap-1">
                  <strong className="text-xl leading-tight">{summary.priceLabel}</strong>
                  <span className="text-sm text-[var(--color-muted)]">{summary.priceCaption}</span>
                </div>
              </div>
              <p className="text-sm text-[var(--color-muted)]">{summary.roomMeta}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1 rounded-2xl bg-[rgb(248_250_252_/_0.9)] px-[14px] py-3">
                  <span className="text-sm text-[var(--color-muted)]">Заезд</span>
                  <strong>{summary.checkIn ?? "Уточните дату"}</strong>
                </div>
                <div className="grid gap-1 rounded-2xl bg-[rgb(248_250_252_/_0.9)] px-[14px] py-3">
                  <span className="text-sm text-[var(--color-muted)]">Выезд</span>
                  <strong>{summary.checkOut ?? "Уточните дату"}</strong>
                </div>
                <div className="grid gap-1 rounded-2xl bg-[rgb(248_250_252_/_0.9)] px-[14px] py-3">
                  <span className="text-sm text-[var(--color-muted)]">Гости</span>
                  <strong>{summary.guestsLabel}</strong>
                </div>
                <div className="grid gap-1 rounded-2xl bg-[rgb(248_250_252_/_0.9)] px-[14px] py-3">
                  <span className="text-sm text-[var(--color-muted)]">Комнаты</span>
                  <strong>{summary.roomsLabel}</strong>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">{summary.requestLabel}</p>
            </div>
          </Panel>
          {quotedRoom && !quotedRoom.isAvailableForFilter && quotedRoom.unavailableReason ? (
            <InlineNotice title="Параметры не подходят" tone="warning">
              {quotedRoom.unavailableReason}. Измените параметры ниже или выберите другой номер.
            </InlineNotice>
          ) : null}
          <InlineNotice title="Что важно знать" tone="soft">
            {contextMessage}
          </InlineNotice>
        </section>
      ) : null}

      {errorMessage ? (
        <InlineNotice title="Не удалось отправить заявку" tone="error">
          {errorMessage}
        </InlineNotice>
      ) : null}

      <Input id="guest-name" name="guestName" label="Ваше имя" autoComplete="name" required />
      <Input id="guest-phone" name="guestPhone" label="Телефон" autoComplete="tel" required />
      <Select
        id="room-id"
        name="roomId"
        label="Номер"
        value={selectedRoomId}
        onChange={(event) => setSelectedRoomId(event.target.value)}
        options={activeRooms.map((room) => ({
          value: room.id,
          label: !room.isAvailableForFilter && room.unavailableReason ? `${room.title} — ${room.unavailableReason}` : room.title,
        }))}
        description={roomFieldHint}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="checkin"
          name="checkIn"
          label="Дата заезда"
          type="date"
          value={checkIn}
          onChange={(event) => setCheckIn(event.target.value)}
          required
        />
        <Input
          id="checkout"
          name="checkOut"
          label="Дата выезда"
          type="date"
          value={checkOut}
          onChange={(event) => setCheckOut(event.target.value)}
          required
        />
      </div>

      <Select
        id="guest-count"
        name="adultsCount"
        label="Количество гостей"
        value={adultsCount}
        onChange={(event) => setAdultsCount(event.target.value)}
        options={Array.from({ length: 8 }, (_, index) => {
          const value = String(index + 1);
          return { value, label: value };
        })}
      />

      <Select
        id="rooms-count"
        name="roomsCount"
        label="Комнаты"
        value={roomsCount}
        onChange={(event) => setRoomsCount(event.target.value)}
        options={Array.from({ length: 5 }, (_, index) => {
          const value = String(index + 1);
          return { value, label: value };
        })}
      />

      <Textarea
        id="guest-comment"
        name="guestComment"
        label="Комментарий"
        placeholder="Например: хотим уточнить ранний заезд или размещение с ребёнком."
      />

      <label className="grid grid-cols-[18px_1fr] items-start gap-2.5 py-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
        <input className="mt-0.5 h-[18px] w-[18px] accent-[var(--color-primary)]" type="checkbox" name="privacyConsent" required />
        <span>Я согласен на обработку персональных данных и понимаю, что заявка передаётся для уточнения доступности.</span>
      </label>

      <SubmitButton fullWidth pendingLabel="Отправляем заявку">Отправить заявку</SubmitButton>
    </form>
  );
}
