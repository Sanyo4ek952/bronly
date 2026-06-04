import { BedDouble, Layers3 } from "lucide-react";
import Link from "next/link";

import { buildCollectionSubtitle, getCollectionManagementData } from "@/entities/collection";
import { formatDateTimeLabel } from "@/shared/lib";
import { AppIcon, Button, Input, Select, StatusPill } from "@/shared/ui";

import {
  addAgentPropertyToCollectionAction,
  addAgentRoomToCollectionAction,
  archiveAgentCollectionAction,
  createAgentCollectionAction,
  removeAgentCollectionItemAction,
  renameAgentCollectionAction,
} from "./actions";

type CollectionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(success: string, error: string) {
  if (success === "created") return "Коллекция создана.";
  if (success === "saved") return "Название коллекции обновлено.";
  if (success === "archived") return "Коллекция отправлена в архив.";
  if (success === "item-added") return "Элемент добавлен в коллекцию.";
  if (success === "item-removed") return "Элемент удален из коллекции.";
  if (error === "duplicate") return "Этот элемент уже есть в коллекции.";
  if (error === "archived") return "Архивированную коллекцию нельзя менять.";
  if (error === "not_allowed") {
    return "Можно добавлять только свои объекты и объекты владельцев при активном сотрудничестве.";
  }
  if (error) return "Не удалось выполнить действие. Проверьте данные и попробуйте еще раз.";

  return "";
}

function getLastOpenedLabel(value: string | null) {
  return value ? formatDateTimeLabel(value) : "Пока не открывали";
}

export default async function AgentCollectionsPage({ searchParams }: CollectionsPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const collectionId = typeof params.collection === "string" ? params.collection : "";
  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";
  const data = await getCollectionManagementData("agent", collectionId);
  const selectedCollection = data.selectedCollection;
  const message = getMessage(success, error);

  return (
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>Коллекции агента</h2>
          <p>Собирайте номера и объекты в персональные подборки для гостя в рамках активных сотрудничеств.</p>
        </div>
      </div>

      <div className="br-inline-notice br-inline-notice--soft">
        В кабинете показывается базовая статистика по публичной ссылке коллекции: количество открытий и время последнего открытия без расширенной аналитики.
      </div>

      {message ? <div className="br-inline-notice">{message}</div> : null}

      <form action={createAgentCollectionAction} className="br-owner-editor br-owner-editor--muted">
        <div className="br-owner-editor__header">
          <div>
            <strong>Новая коллекция</strong>
            <p>Название можно сразу задать под конкретного гостя.</p>
          </div>
        </div>
        <div className="br-form-grid">
          <Input id="agent-collection-title" name="title" label="Название коллекции" placeholder="Например, для Ольги" />
        </div>
        <div className="br-owner-actions">
          <Button type="submit">Создать коллекцию</Button>
        </div>
      </form>

      <div className="br-dashboard-section-grid">
        <aside className="br-owner-stack">
          {data.collections.length ? (
            data.collections.map((collection) => {
              const isActive = data.selectedCollection?.id === collection.id;

              return (
                <Link
                  key={collection.id}
                  href={`/agent/dashboard/collections?collection=${collection.id}`}
                  className={`br-collection-card br-card${isActive ? " br-collection-card--active" : ""}`}
                >
                  <div className="br-collection-card__top">
                    <strong>{collection.title}</strong>
                    <StatusPill variant={collection.isArchived ? "inactive" : "active"}>
                      {collection.isArchived ? "Архив" : "Активна"}
                    </StatusPill>
                  </div>
                  <span>{buildCollectionSubtitle(collection.itemCount, collection.isArchived)}</span>
                  <span>Открытия: {collection.viewsCount}</span>
                </Link>
              );
            })
          ) : (
            <article className="br-empty-card br-card">
              <div className="br-empty-card__art" aria-hidden="true">
                <AppIcon icon={Layers3} />
              </div>
              <strong>Пока нет коллекций</strong>
              <p>Создайте первую подборку, чтобы быстро собирать варианты для гостя.</p>
            </article>
          )}
        </aside>

        <div className="br-owner-stack">
          {selectedCollection ? (
            <>
              <article className="br-owner-editor">
                <div className="br-owner-editor__header">
                  <div>
                    <strong>{selectedCollection.title}</strong>
                    <p>{buildCollectionSubtitle(selectedCollection.itemCount, selectedCollection.isArchived)}</p>
                  </div>
                </div>

                <div className="br-owner-stack" style={{ gap: 8 }}>
                  <p className="br-owner-muted">Открытия: {selectedCollection.viewsCount}</p>
                  <p className="br-owner-muted">Последнее открытие: {getLastOpenedLabel(selectedCollection.lastOpenedAt)}</p>
                </div>

                <form action={renameAgentCollectionAction} className="br-owner-stack">
                  <input type="hidden" name="collectionId" value={selectedCollection.id} />
                  <Input
                    id="agent-selected-collection-title"
                    name="title"
                    label="Название коллекции"
                    defaultValue={selectedCollection.title}
                  />
                  <div className="br-owner-actions">
                    <Button type="submit" disabled={selectedCollection.isArchived}>
                      Сохранить название
                    </Button>
                  </div>
                </form>

                <form action={archiveAgentCollectionAction}>
                  <input type="hidden" name="collectionId" value={selectedCollection.id} />
                  <Button type="submit" variant="danger" disabled={selectedCollection.isArchived}>
                    {selectedCollection.isArchived ? "Коллекция в архиве" : "Архивировать коллекцию"}
                  </Button>
                </form>
              </article>

              <article className="br-owner-editor">
                <div className="br-owner-editor__header">
                  <div>
                    <strong>Состав коллекции</strong>
                    <p>Даже при добавлении объекта гость выбирает конкретный номер перед отправкой заявки.</p>
                  </div>
                </div>

                {data.items.length ? (
                  <div className="br-requests-list">
                    {data.items.map((item) => (
                      <article key={item.id} className="br-request-item br-request-item--static">
                        <div className="br-request-item__avatar">{item.kind === "property" ? "О" : "Н"}</div>
                        <div className="br-request-item__body">
                          <strong>{item.title}</strong>
                          <span>{item.subtitle}</span>
                          <span>{item.kind === "property" ? "Объект целиком" : "Конкретный номер"}</span>
                        </div>
                        <form action={removeAgentCollectionItemAction}>
                          <input type="hidden" name="collectionId" value={selectedCollection.id} />
                          <input type="hidden" name="itemId" value={item.id} />
                          <Button type="submit" variant="danger" disabled={selectedCollection.isArchived}>
                            Удалить
                          </Button>
                        </form>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="br-owner-muted">В коллекции пока нет элементов.</p>
                )}
              </article>

              <article className="br-owner-editor">
                <div className="br-owner-editor__header">
                  <div>
                    <strong>Добавить объект</strong>
                    <p>Агент может добавлять свои объекты и объекты владельцев только при активном сотрудничестве.</p>
                  </div>
                </div>

                <form action={addAgentPropertyToCollectionAction} className="br-owner-stack">
                  <input type="hidden" name="collectionId" value={selectedCollection.id} />
                  <Select
                    id="agent-collection-property"
                    name="propertyId"
                    label="Объект"
                    defaultValue=""
                    disabled={selectedCollection.isArchived || !data.availableProperties.length}
                  >
                    <option value="">Выберите объект</option>
                    {data.availableProperties.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} · {item.subtitle}
                        {item.scope === "collaboration" ? " · сотрудничество" : ""}
                      </option>
                    ))}
                  </Select>
                  <div className="br-owner-actions">
                    <Button type="submit" disabled={selectedCollection.isArchived || !data.availableProperties.length}>
                      Добавить объект
                    </Button>
                  </div>
                </form>
              </article>

              <article className="br-owner-editor">
                <div className="br-owner-editor__header">
                  <div>
                    <strong>Добавить номер</strong>
                    <p>Доступны свои номера и номера владельцев при активном сотрудничестве.</p>
                  </div>
                </div>

                <form action={addAgentRoomToCollectionAction} className="br-owner-stack">
                  <input type="hidden" name="collectionId" value={selectedCollection.id} />
                  <Select
                    id="agent-collection-room"
                    name="roomId"
                    label="Номер"
                    defaultValue=""
                    disabled={selectedCollection.isArchived || !data.availableRooms.length}
                  >
                    <option value="">Выберите номер</option>
                    {data.availableRooms.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} · {item.subtitle}
                        {item.scope === "collaboration" ? " · сотрудничество" : ""}
                      </option>
                    ))}
                  </Select>
                  <div className="br-owner-actions">
                    <Button type="submit" disabled={selectedCollection.isArchived || !data.availableRooms.length}>
                      Добавить номер
                    </Button>
                  </div>
                </form>
              </article>
            </>
          ) : (
            <article className="br-empty-card br-card">
              <div className="br-empty-card__art" aria-hidden="true">
                <AppIcon icon={BedDouble} />
              </div>
              <strong>Выберите коллекцию</strong>
              <p>После создания или выбора коллекции здесь появится ее состав и действия управления.</p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
