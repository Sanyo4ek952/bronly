export type PublicUnavailableReason = "subscription_expired" | "admin_hidden";

type PublicUnavailableVariant = "ownerPage" | "ownerRequest" | "agent" | "collection";

export function getPublicUnavailableContent(
  variant: PublicUnavailableVariant,
  reason: PublicUnavailableReason | null,
) {
  if (reason === "admin_hidden") {
    return {
      title: "Страница временно недоступна",
      description: "Публичная ссылка временно скрыта. Попробуйте открыть ее позже.",
      showLogin: false,
    };
  }

  switch (variant) {
    case "ownerPage":
      return {
        title: "Страница временно недоступна",
        description:
          "Доступ к сервису еще не продлен. Если это ваша страница, войдите в кабинет и продлите подписку.",
        showLogin: true,
      };
    case "ownerRequest":
      return {
        title: "Страница временно недоступна",
        description: "Доступ к сервису еще не продлен. Новые заявки по этой ссылке сейчас не принимаются.",
        showLogin: true,
      };
    case "agent":
      return {
        title: "Страница временно недоступна",
        description: "Доступ к агентской витрине сейчас ограничен. Новые заявки по этой ссылке не принимаются.",
        showLogin: false,
      };
    case "collection":
      return {
        title: "Страница временно недоступна",
        description: "Новые заявки по этой ссылке сейчас не принимаются.",
        showLogin: false,
      };
  }
}
