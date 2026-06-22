import { HousePlus } from "lucide-react";

import { getOwnerInventory } from "@/entities/property";
import { readFeedbackSearchParams, readSearchParams } from "@/shared/lib";
import { AppIcon, ButtonLink } from "@/shared/ui";
import { AddInventoryButton } from "@/widgets/add-inventory-button";
import { AdminPageHeader, PropertyInventoryBrowser } from "@/widgets/property-admin";

import { getPropertyNotice, getRoomsNotice } from "./page-helpers";

type PropertiesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(error: string, success: string) {
  if (success === "deleted") {
    return "Объект удалён.";
  }

  return getPropertyNotice(error, success) || getRoomsNotice(error, success);
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await readSearchParams(searchParams);
  const { error, success } = readFeedbackSearchParams(params);
  const inventory = await getOwnerInventory();

  const properties = inventory.filter((item) => item.kind !== "standalone_room");
  const standaloneRooms = inventory.filter((item) => item.kind === "standalone_room");
  const message = getMessage(error, success);

  return (
    <section className="br-owner-stack">
      <AdminPageHeader
        title="Объекты и номера"
        description="Управляйте объектами, отдельными номерами, фото и публикацией в одном месте. Карточки остаются короткими и читаемыми даже на телефоне."
        actions={<AddInventoryButton />}
        notice={message ? <div className="br-inline-notice">{message}</div> : null}
      />

      {inventory.length ? (
        <PropertyInventoryBrowser properties={properties} standaloneRooms={standaloneRooms} />
      ) : (
        <article className="br-empty-card br-card">
          <div className="br-empty-card__art" aria-hidden="true">
            <AppIcon icon={HousePlus} />
          </div>
          <strong>Пока нет объектов и номеров</strong>
          <p>Добавьте объект с номерами или создайте отдельный номер, чтобы перейти к ценам, фото и календарю занятости.</p>
          <div className="br-owner-stack" style={{ width: "100%" }}>
            <ButtonLink href="/dashboard/properties/new" fullWidth>
              Создать объект
            </ButtonLink>
            <ButtonLink href="/dashboard/rooms/new" variant="secondary" fullWidth>
              Создать отдельный номер
            </ButtonLink>
          </div>
        </article>
      )}
    </section>
  );
}
