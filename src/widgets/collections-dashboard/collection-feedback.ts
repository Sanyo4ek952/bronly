export function getCollectionFeedbackMessage(success: string, error: string) {
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
  if (error === "validation") return "Проверьте заполнение полей и попробуйте еще раз.";
  if (error) return "Не удалось выполнить действие. Проверьте данные и попробуйте еще раз.";

  return "";
}
