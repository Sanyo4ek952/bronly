import type { CollaborationContact, CollaborationTargetSummary } from "@/entities/collaboration";
import { toPhoneHref, toTelegramHref, toWhatsAppHref } from "@/shared/lib";
import { ButtonLink, Panel } from "@/shared/ui";

function getTargetFormatLabel(targetType: CollaborationTargetSummary["targetType"]) {
  return targetType === "property" ? "Формат: объект" : "Формат: отдельный номер";
}

export function CollaborationContactLinks({
  contact,
  emptyText = "Контакты не заполнены.",
}: {
  contact: CollaborationContact;
  emptyText?: string;
}) {
  const phoneHref = contact.phone ? toPhoneHref(contact.phone) : undefined;
  const whatsAppHref = contact.whatsapp
    ? contact.whatsapp.startsWith("http")
      ? contact.whatsapp
      : toWhatsAppHref(contact.whatsapp)
    : undefined;
  const telegramHref = contact.telegram
    ? contact.telegram.startsWith("http")
      ? contact.telegram
      : toTelegramHref(contact.telegram)
    : undefined;

  if (!phoneHref && !whatsAppHref && !telegramHref) {
    return <span className="text-sm leading-relaxed text-[var(--text-muted)]">{emptyText}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {phoneHref ? (
        <ButtonLink href={phoneHref} variant="secondary" size="sm">
          {contact.phone}
        </ButtonLink>
      ) : null}
      {whatsAppHref ? (
        <ButtonLink href={whatsAppHref} variant="secondary" size="sm" target="_blank" rel="noreferrer">
          WhatsApp
        </ButtonLink>
      ) : null}
      {telegramHref ? (
        <ButtonLink href={telegramHref} variant="secondary" size="sm" target="_blank" rel="noreferrer">
          Telegram
        </ButtonLink>
      ) : null}
    </div>
  );
}

export function CollaborationTargets({
  targets,
  presentation = "cards",
}: {
  targets: CollaborationTargetSummary[];
  presentation?: "cards" | "flat";
}) {
  if (presentation === "flat") {
    return (
      <ul className="grid divide-y divide-[var(--border)]">
        {targets.map((target) => (
          <li
            key={`${target.targetType}-${target.id}`}
            className="grid min-w-0 gap-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-4"
          >
            <strong className="min-w-0 [overflow-wrap:anywhere] text-sm font-semibold text-[var(--text)]">{target.targetTitle}</strong>
            <span className="text-xs leading-relaxed text-[var(--text-muted)]">
              {target.targetType === "property" ? "Объект" : "Отдельный номер"}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid gap-2">
      {targets.map((target) => (
        <Panel
          key={`${target.targetType}-${target.id}`}
          className="grid gap-1 rounded-[18px] border-[rgb(var(--color-primary-rgb)_/_0.10)]"
          surface="subtle"
          padding="md"
        >
          <strong className="text-sm font-semibold text-[var(--text)]">{target.targetTitle}</strong>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">{getTargetFormatLabel(target.targetType)}</p>
        </Panel>
      ))}
    </div>
  );
}

export { getTargetFormatLabel };
