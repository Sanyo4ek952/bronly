export function getPropertyNotice(error: string, success: string) {
  if (success === "created") {
    return "Объект создан.";
  }
  if (success === "saved") {
    return "Изменения по объекту сохранены.";
  }
  if (success === "photo-uploaded") {
    return "Фото объекта добавлено.";
  }
  if (success === "photo-deleted") {
    return "Фото объекта удалено.";
  }
  if (success === "photo-primary") {
    return "Обложка объекта обновлена.";
  }

  switch (error) {
    case "validation":
      return "Проверьте обязательные поля и порядок дат.";
    case "duplicate":
      return "Не удалось сохранить объект. Попробуйте изменить название.";
    case "subscription":
      return "Подписка не продлена. Изменение объекта временно недоступно.";
    case "delete-confirmation":
      return "Для удаления введите DELETE в поле подтверждения.";
    case "delete":
      return "Удаление не удалось.";
    case "save":
      return "Не удалось сохранить изменения.";
    case "photo-validation":
      return "Выберите изображение для загрузки.";
    case "photo-type":
      return "Поддерживаются только JPG, PNG, WebP и GIF.";
    case "photo-size":
      return "Размер файла должен быть не больше 5 МБ.";
    case "photo-upload":
      return "Не удалось загрузить фото объекта.";
    case "photo-delete":
      return "Не удалось удалить фото объекта.";
    case "photo-order":
      return "Не удалось обновить порядок фото объекта.";
    default:
      return "";
  }
}

export function getRoomsNotice(error: string, success: string) {
  if (success === "room-created") {
    return "Номер добавлен.";
  }
  if (success === "room-created-photo-upload") {
    return "Номер добавлен, но фото не загрузились. Попробуйте добавить их еще раз.";
  }
  if (success === "room-saved") {
    return "Номер обновлён.";
  }
  if (success === "room-deleted") {
    return "Номер удалён.";
  }
  if (success === "season-created") {
    return "Сезонная цена добавлена.";
  }
  if (success === "season-saved") {
    return "Сезонная цена обновлена.";
  }
  if (success === "season-deleted") {
    return "Сезонная цена удалена.";
  }
  if (success === "room-photo-uploaded") {
    return "Фото номера добавлено.";
  }
  if (success === "room-photo-deleted") {
    return "Фото номера удалено.";
  }
  if (success === "room-photo-primary") {
    return "Главное фото номера обновлено.";
  }

  switch (error) {
    case "validation":
      return "Проверьте обязательные поля и порядок дат.";
    case "duplicate":
      return "Не удалось сохранить номер. Попробуйте изменить название.";
    case "subscription":
      return "Подписка не продлена. Изменение номеров временно недоступно.";
    case "room-limit":
      return "Лимит активных номеров исчерпан. Деактивируйте один из текущих активных номеров или продлите подписку с большим лимитом.";
    case "overlap":
      return "Сезонные цены не должны пересекаться по датам.";
    case "delete-confirmation":
      return "Для удаления введите DELETE в поле подтверждения.";
    case "delete":
      return "Удаление не удалось.";
    case "save":
      return "Не удалось сохранить изменения.";
    case "room-photo-validation":
      return "Выберите изображение для номера.";
    case "room-photo-type":
      return "Для номера поддерживаются только JPG, PNG, WebP и GIF.";
    case "room-photo-size":
      return "Размер фото номера должен быть не больше 5 МБ.";
    case "room-photo-count":
      return "За один раз можно загрузить до 10 фото номера.";
    case "room-photo-upload":
      return "Не удалось загрузить фото номера.";
    case "room-photo-delete":
      return "Не удалось удалить фото номера.";
    case "room-photo-order":
      return "Не удалось обновить порядок фото номера.";
    default:
      return "";
  }
}

export function getRoomCreateNotice(error: string) {
  switch (error) {
    case "validation":
      return "Проверьте обязательные поля номера.";
    case "duplicate":
      return "Не удалось создать номер. Попробуйте изменить название.";
    case "subscription":
      return "Подписка не продлена. Добавление номера временно недоступно.";
    case "room-limit":
      return "Лимит активных номеров исчерпан. Можно сохранить номер как неактивный или сначала освободить место в лимите.";
    case "room-photo-type":
      return "Для номера поддерживаются только JPG, PNG, WebP и GIF.";
    case "room-photo-size":
      return "Размер фото номера должен быть не больше 5 МБ.";
    case "room-photo-count":
      return "За один раз можно загрузить до 10 фото номера.";
    case "save":
      return "Не удалось создать номер.";
    default:
      return "";
  }
}

export function getCalendarNotice(error: string, success: string) {
  if (success === "busy-created") {
    return "Занятые даты добавлены.";
  }
  if (success === "busy-saved") {
    return "Диапазон занятых дат обновлён.";
  }
  if (success === "busy-deleted") {
    return "Диапазон занятых дат удалён.";
  }

  switch (error) {
    case "validation":
      return "Проверьте обязательные поля и порядок дат.";
    case "overlap":
      return "Занятые даты не должны пересекаться по одному номеру.";
    case "subscription":
      return "Подписка не продлена. Изменение календаря временно недоступно.";
    case "delete":
      return "Удаление не удалось.";
    case "save":
      return "Не удалось сохранить изменения.";
    default:
      return "";
  }
}

export function formatMoney(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}
