"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { normalizePublicStayFilters, type PublicStayFilters } from "@/entities/room/model/pricing";
import type { PublicRoom } from "@/entities/room/model/types";
import { InlineNotice, Input, Select, SubmitButton, Textarea } from "@/shared/ui";

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
  const summary = selectedRoom ? buildPublicRequestSummary(selectedRoom, summaryFilters, propertyTitle) : null;

  return (
    <form className="br-request-form" action={action}>
      {publicSlug ? <input type="hidden" name="publicSlug" value={publicSlug} /> : null}
      {propertySlug ? <input type="hidden" name="propertySlug" value={propertySlug} /> : null}
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}

      {summary ? (
        <section className="br-request-summary">
          <div className="br-request-summary__card">
            <div className="br-request-summary__media">
              {summary.imageUrl ? (
                <Image
                  src={summary.imageUrl}
                  alt={summary.roomTitle}
                  width={1200}
                  height={800}
                  unoptimized
                  className="br-request-summary__image"
                />
              ) : (
                <div className="br-request-summary__placeholder" aria-hidden="true" />
              )}
            </div>
            <div className="br-request-summary__body">
              <span className="br-request-summary__eyebrow">Выбранный номер</span>
              <div className="br-request-summary__heading">
                <div>
                  <h2>{summary.roomTitle}</h2>
                  {summary.propertyTitle ? <p>{summary.propertyTitle}</p> : null}
                </div>
                <div className="br-request-summary__price">
                  <strong>{summary.priceLabel}</strong>
                  <span>{summary.priceCaption}</span>
                </div>
              </div>
              <p className="br-request-summary__meta">{summary.roomMeta}</p>
              <div className="br-request-summary__facts">
                <div className="br-request-summary__fact">
                  <span>Заезд</span>
                  <strong>{summary.checkIn ?? "Уточните дату"}</strong>
                </div>
                <div className="br-request-summary__fact">
                  <span>Выезд</span>
                  <strong>{summary.checkOut ?? "Уточните дату"}</strong>
                </div>
                <div className="br-request-summary__fact">
                  <span>Гости</span>
                  <strong>{summary.guestsLabel}</strong>
                </div>
                <div className="br-request-summary__fact">
                  <span>Комнаты</span>
                  <strong>{summary.roomsLabel}</strong>
                </div>
              </div>
              <p className="br-request-summary__request-label">{summary.requestLabel}</p>
            </div>
          </div>
          <InlineNotice className="br-request-summary__notice" title="Что важно знать" tone="soft">
            {contextMessage}
          </InlineNotice>
        </section>
      ) : null}

      {errorMessage ? (
        <InlineNotice className="br-request-form__notice br-request-form__notice--warning" title="Не удалось отправить заявку">
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
          label: room.unavailableReason ? `${room.title} - ${room.unavailableReason}` : room.title,
        }))}
        required
      />

      <div className="br-inline-fields">
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

      <label className="br-check">
        <input type="checkbox" required />
        <span>
          Я согласен на обработку персональных данных и понимаю, что заявка передаётся для уточнения доступности.
        </span>
      </label>

      <SubmitButton fullWidth pendingLabel="Отправляем заявку">Отправить заявку</SubmitButton>
    </form>
  );
}
