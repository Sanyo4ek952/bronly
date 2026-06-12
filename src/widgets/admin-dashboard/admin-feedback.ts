export function getAdminFeedbackMessage(input: { success?: string; error?: string }) {
  if (input.success === "subscription-extended") {
    return "Подписка продлена на 30 дней.";
  }

  if (input.success === "subscription-saved") {
    return "Подписка обновлена.";
  }

  if (input.success === "profile-hidden") {
    return "Публичные страницы профиля скрыты администратором.";
  }

  if (input.success === "profile-unhidden") {
    return "Публичные страницы профиля снова доступны.";
  }

  if (input.success === "property-frozen") {
    return "Объект заморожен.";
  }

  if (input.success === "property-unfrozen") {
    return "Объект разморожен.";
  }

  if (input.success === "referral-approved") {
    return "Реферальное продление подтверждено.";
  }

  if (input.success === "referral-rejected") {
    return "Реферальное начисление отклонено.";
  }

  if (input.error) {
    return "Не удалось выполнить действие. Проверьте данные и попробуйте ещё раз.";
  }

  return "";
}
