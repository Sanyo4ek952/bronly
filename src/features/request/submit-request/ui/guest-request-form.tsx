import type { PublicStayFilters } from "@/entities/room";
import type { PublicRoom } from "@/entities/room/model/types";
import { Button, Input, Select, Textarea } from "@/shared/ui";

type GuestRequestFormProps = {
  publicSlug?: string;
  propertySlug: string;
  rooms: PublicRoom[];
  defaultRoomId: string;
  filters: PublicStayFilters;
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Array<{ name: string; value: string }>;
};

export function GuestRequestForm({
  publicSlug,
  propertySlug,
  rooms,
  defaultRoomId,
  filters,
  action,
  hiddenFields = [],
}: GuestRequestFormProps) {
  const activeRooms = rooms.filter((room) => room.status === "active");

  return (
    <form className="br-request-form" action={action}>
      {publicSlug ? <input type="hidden" name="publicSlug" value={publicSlug} /> : null}
      <input type="hidden" name="propertySlug" value={propertySlug} />
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}

      <Input id="guest-name" name="guestName" label="Ваше имя" autoComplete="name" required />
      <Input id="guest-phone" name="guestPhone" label="Телефон" autoComplete="tel" required />
      <Select
        id="room-id"
        name="roomId"
        label="Номер"
        defaultValue={defaultRoomId}
        options={activeRooms.map((room) => ({
          value: room.id,
          label: room.unavailableReason ? `${room.title} - ${room.unavailableReason}` : room.title,
        }))}
        required
      />

      <div className="br-inline-fields">
        <Input id="checkin" name="checkIn" label="Дата заезда" type="date" defaultValue={filters.checkIn} required />
        <Input id="checkout" name="checkOut" label="Дата выезда" type="date" defaultValue={filters.checkOut} required />
      </div>

      <Select
        id="guest-count"
        name="adultsCount"
        label="Количество гостей"
        defaultValue={String(filters.adults)}
        options={Array.from({ length: 8 }, (_, index) => {
          const value = String(index + 1);
          return { value, label: value };
        })}
      />

      <Select
        id="rooms-count"
        name="roomsCount"
        label="Комнат"
        defaultValue={String(filters.rooms)}
        options={Array.from({ length: 5 }, (_, index) => {
          const value = String(index + 1);
          return { value, label: value };
        })}
      />

      <Textarea
        id="guest-comment"
        name="guestComment"
        label="Комментарий"
        placeholder="Например: хотим уточнить ранний заезд или размещение с ребенком."
      />

      <label className="br-check">
        <input type="checkbox" required />
        <span>
          Я согласен на обработку персональных данных и понимаю, что заявка передается владельцу для уточнения
          доступности.
        </span>
      </label>

      <Button fullWidth type="submit">
        Отправить заявку
      </Button>
    </form>
  );
}
