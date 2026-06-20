import type { PublicStayFilters } from "@/entities/room";
import type { PublicRoom } from "@/entities/room/model/types";
import { Input, Select, SubmitButton, Textarea } from "@/shared/ui";

type GuestRequestFormProps = {
  publicSlug?: string;
  propertySlug?: string;
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
      {propertySlug ? <input type="hidden" name="propertySlug" value={propertySlug} /> : null}
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}

      <Input id="guest-name" name="guestName" label="Р’Р°С€Рµ РёРјСЏ" autoComplete="name" required />
      <Input id="guest-phone" name="guestPhone" label="РўРµР»РµС„РѕРЅ" autoComplete="tel" required />
      <Select
        id="room-id"
        name="roomId"
        label="РќРѕРјРµСЂ"
        defaultValue={defaultRoomId}
        options={activeRooms.map((room) => ({
          value: room.id,
          label: room.unavailableReason ? `${room.title} - ${room.unavailableReason}` : room.title,
        }))}
        required
      />

      <div className="br-inline-fields">
        <Input id="checkin" name="checkIn" label="Р”Р°С‚Р° Р·Р°РµР·РґР°" type="date" defaultValue={filters.checkIn} required />
        <Input id="checkout" name="checkOut" label="Р”Р°С‚Р° РІС‹РµР·РґР°" type="date" defaultValue={filters.checkOut} required />
      </div>

      <Select
        id="guest-count"
        name="adultsCount"
        label="РљРѕР»РёС‡РµСЃС‚РІРѕ РіРѕСЃС‚РµР№"
        defaultValue={String(filters.adults)}
        options={Array.from({ length: 8 }, (_, index) => {
          const value = String(index + 1);
          return { value, label: value };
        })}
      />

      <Select
        id="rooms-count"
        name="roomsCount"
        label="РљРѕРјРЅР°С‚"
        defaultValue={String(filters.rooms)}
        options={Array.from({ length: 5 }, (_, index) => {
          const value = String(index + 1);
          return { value, label: value };
        })}
      />

      <Textarea
        id="guest-comment"
        name="guestComment"
        label="РљРѕРјРјРµРЅС‚Р°СЂРёР№"
        placeholder="РќР°РїСЂРёРјРµСЂ: С…РѕС‚РёРј СѓС‚РѕС‡РЅРёС‚СЊ СЂР°РЅРЅРёР№ Р·Р°РµР·Рґ РёР»Рё СЂР°Р·РјРµС‰РµРЅРёРµ СЃ СЂРµР±РµРЅРєРѕРј."
      />

      <label className="br-check">
        <input type="checkbox" required />
        <span>
          РЇ СЃРѕРіР»Р°СЃРµРЅ РЅР° РѕР±СЂР°Р±РѕС‚РєСѓ РїРµСЂСЃРѕРЅР°Р»СЊРЅС‹С… РґР°РЅРЅС‹С… Рё РїРѕРЅРёРјР°СЋ, С‡С‚Рѕ Р·Р°СЏРІРєР° РїРµСЂРµРґР°РµС‚СЃСЏ РІР»Р°РґРµР»СЊС†Сѓ РґР»СЏ СѓС‚РѕС‡РЅРµРЅРёСЏ
          РґРѕСЃС‚СѓРїРЅРѕСЃС‚Рё.
        </span>
      </label>

      <SubmitButton fullWidth pendingLabel="Отправка заявки">РћС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ</SubmitButton>
    </form>
  );
}
