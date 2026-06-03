export function getPropertyNotice(error: string, success: string) {
  if (success === "created") {
    return "Объект создан.";
  }
  if (success === "saved") {
    return "Изменения по объекту сохранены.";
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
    default:
      return "";
  }
}

export function getRoomsNotice(error: string, success: string) {
  if (success === "room-created") {
    return "Номер добавлен.";
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

  switch (error) {
    case "validation":
      return "Проверьте обязательные поля и порядок дат.";
    case "duplicate":
      return "Не удалось сохранить номер. Попробуйте изменить название.";
    case "subscription":
      return "Подписка не продлена. Изменение номеров временно недоступно.";
    case "overlap":
      return "Сезонные цены не должны пересекаться по датам.";
    case "delete-confirmation":
      return "Для удаления введите DELETE в поле подтверждения.";
    case "delete":
      return "Удаление не удалось.";
    case "save":
      return "Не удалось сохранить изменения.";
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
