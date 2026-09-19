export function getAdminFeedbackMessage(input: { success?: string; error?: string }) {
  if (input.success === "payment-month-recorded") {
    return "Оплата 490 ₽ зарегистрирована, доступ продлён на 30 дней.";
  }

  if (input.success === "payment-year-recorded") {
    return "Оплата 4 490 ₽ зарегистрирована, доступ продлён на 365 дней.";
  }

  if (input.success === "subscription-trial-started") {
    return "Пробный период на 30 дней начат.";
  }

  if (input.success === "subscription-days-added") {
    return "Бесплатные дни добавлены. Причина сохранена в истории.";
  }

  if (input.success === "subscription-limit-saved") {
    return "Индивидуальный лимит номеров обновлён.";
  }

  if (input.success === "subscription-access-ended") {
    return "Доступ завершён. Данные пользователя сохранены.";
  }

  if (input.success === "profile-hidden") {
    return "Публичные страницы профиля скрыты администратором.";
  }

  if (input.success === "profile-unhidden") {
    return "Публичные страницы профиля снова доступны.";
  }

  if (input.success === "profile-already_hidden") {
    return "Публичные страницы уже были скрыты. Повторное изменение не выполнялось.";
  }

  if (input.success === "profile-already_visible") {
    return "Публичные страницы уже были доступны. Повторное изменение не выполнялось.";
  }

  if (input.success === "property-frozen") {
    return "Объект заморожен.";
  }

  if (input.success === "property-unfrozen") {
    return "Объект разморожен.";
  }

  if (input.success === "property-already_frozen") {
    return "Объект уже был заморожен. Повторное изменение не выполнялось.";
  }

  if (input.success === "property-already_unfrozen") {
    return "Объект уже был разморожен. Повторное изменение не выполнялось.";
  }

  if (input.success === "referral-approved") {
    return "Реферальное продление подтверждено.";
  }

  if (input.success === "referral-rejected") {
    return "Реферальное начисление отклонено.";
  }

  if (input.success === "referral-already_approved") {
    return "Реферальное продление уже подтверждено. Повторное продление не выполнялось.";
  }

  if (input.success === "referral-already_rejected") {
    return "Реферальное продление уже отклонено. Повторное действие не выполнялось.";
  }

  if (input.error === "referral-state") {
    return "Решение уже было принято другим действием. Обновите очередь перед повторной проверкой.";
  }

  if (input.error) {
    return "Не удалось выполнить действие. Проверьте данные и попробуйте ещё раз.";
  }

  return "";
}
