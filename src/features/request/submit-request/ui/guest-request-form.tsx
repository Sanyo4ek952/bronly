import type { PublicPropertyPageData } from "@/entities/property";
import type { PublicStayFilters } from "@/entities/room";
import { Button, Input, Select, Textarea } from "@/shared/ui";

type GuestRequestFormProps = {
  propertySlug: string;
  rooms: PublicPropertyPageData["rooms"];
  defaultRoomId: string;
  filters: PublicStayFilters;
  action: (formData: FormData) => void | Promise<void>;
};

export function GuestRequestForm({
  propertySlug,
  rooms,
  defaultRoomId,
  filters,
  action,
}: GuestRequestFormProps) {
  const activeRooms = rooms.filter((room) => room.status === "active");

  return (
    <form className="br-request-form" action={action}>
      <input type="hidden" name="propertySlug" value={propertySlug} />

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
        <Input
          id="checkin"
          name="checkIn"
          label="Дата заезда"
          type="date"
          defaultValue={filters.checkIn}
          required
        />
        <Input
          id="checkout"
          name="checkOut"
          label="Дата выезда"
          type="date"
          defaultValue={filters.checkOut}
          required
        />
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

      <Textarea
        id="guest-comment"
        name="guestComment"
        label="Комментарий"
        placeholder="Например: хотим уточнить ранний заезд или размещение с ребенком."
      />

      <label className="br-check">
        <input type="checkbox" required />
        <span>
          Я согласен на обработку персональных данных и понимаю, что заявка передается владельцу для
          уточнения доступности.
        </span>
      </label>

      <Button fullWidth type="submit">
        Отправить заявку
      </Button>
    </form>
  );
}
