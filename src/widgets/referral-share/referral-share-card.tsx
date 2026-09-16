"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";

import type { ReferralInviteSummary } from "@/entities/referral";
import { AppIcon, Button, InlineNotice, Panel, type InlineNoticeTone } from "@/shared/ui";

type ReferralShareCardProps = {
  invite: ReferralInviteSummary;
  title: string;
  description: string;
  presentation?: "default" | "owner";
  activeTabId?: string;
};

type ReferralNotice = {
  message: string;
  tone: InlineNoticeTone;
};

function getMilestoneCopy(invite: ReferralInviteSummary) {
  return invite.inviteeRole === "agent"
    ? "Для агента — первое активное сотрудничество."
    : "Для владельца — первый объект или отдельный номер.";
}

export function ReferralShareCard({
  invite,
  title,
  description,
  presentation = "default",
  activeTabId,
}: ReferralShareCardProps) {
  const [notice, setNotice] = useState<ReferralNotice | null>(null);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(`${invite.shareMessage}\n\n${invite.inviteUrl}`);
      setNotice({ message: "Ссылка и текст приглашения скопированы.", tone: "default" });
    } catch {
      setNotice({
        message: "Не удалось скопировать автоматически. Скопируйте ссылку вручную.",
        tone: "error",
      });
    }
  }

  async function shareInvite() {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      await copyInvite();
      return;
    }

    try {
      await navigator.share({
        title,
        text: invite.shareMessage,
        url: invite.inviteUrl,
      });
      setNotice({ message: "Приглашение готово к отправке.", tone: "default" });
    } catch {
      setNotice(null);
    }
  }

  if (presentation === "owner") {
    return (
      <Panel
        className="min-w-0 overflow-hidden shadow-[var(--shadow-md)]"
        id="owner-referral-panel"
        role="tabpanel"
        aria-labelledby={activeTabId}
      >
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-w-0 content-start gap-[22px] p-[26px] max-[640px]:p-4">
            <div className="inline-flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
              <span className="grid size-[38px] place-items-center rounded-[13px] bg-[rgb(var(--color-primary-rgb)_/_0.11)]" aria-hidden="true">
                <AppIcon icon={UserPlus} className="size-[18px]" />
              </span>
              <span>Приглашение для {invite.inviteeRole === "agent" ? "агента" : "владельца"}</span>
            </div>

            <div className="grid gap-2.5">
              <h2 className="text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--text)]">{title}</h2>
              <p className="text-sm leading-[1.62] text-[var(--text-muted)]">{description}</p>
            </div>

            <div className="grid gap-2.5 border-t border-[var(--border)] pt-[19px]">
              <h3 className="text-sm font-bold leading-[1.35] text-[var(--text)]">Текст приглашения</h3>
              <p className="max-w-full [overflow-wrap:anywhere] text-sm leading-[1.62] text-[var(--text)]">
                {invite.shareMessage}
              </p>
            </div>
          </div>

          <aside className="grid min-w-0 content-start gap-4 border-l border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-muted),var(--surface)_74%)] p-[26px] max-[1023px]:border-l-0 max-[1023px]:border-t max-[640px]:p-4" aria-label="Готовая ссылка и действия">
            <div className="grid min-w-0 gap-2.5">
              <h3 className="text-sm font-bold leading-[1.35] text-[var(--text)]">Готовая ссылка</h3>
              <p className="max-w-full [overflow-wrap:anywhere] font-mono text-[13px] leading-[1.6] text-[var(--text)]">
                {invite.inviteUrl}
              </p>
            </div>

            <div className="grid gap-2.5">
              <Button type="button" onClick={shareInvite} fullWidth className="min-h-11">
                Поделиться
              </Button>
              <Button type="button" variant="secondary" onClick={copyInvite} fullWidth className="min-h-11">
                Скопировать
              </Button>
            </div>

            {notice ? (
              <InlineNotice
                aria-live="polite"
                tone={notice.tone}
                className="[overflow-wrap:anywhere]"
              >
                {notice.message}
              </InlineNotice>
            ) : null}
          </aside>
        </div>

        <section className="border-t border-[var(--border)] px-[26px] pb-[26px] pt-[23px] max-[640px]:p-4" aria-labelledby="owner-referral-steps-title">
          <div className="mb-[18px] flex items-baseline justify-between gap-4 max-[640px]:grid max-[640px]:gap-1.5">
            <h3 id="owner-referral-steps-title" className="text-sm font-bold leading-[1.35] text-[var(--text)]">
              Как работает продление
            </h3>
            <p className="text-[13px] leading-[1.5] text-[var(--text-muted)]">Бонус не начисляется автоматически</p>
          </div>

          <ol className="grid min-w-0 grid-cols-3 max-[760px]:grid-cols-1">
            <li className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] gap-[11px] pr-[22px] max-[760px]:pb-[18px] max-[760px]:pr-0">
              <span className="grid size-[34px] place-items-center rounded-full bg-[var(--surface-subtle)] text-xs font-extrabold text-[var(--accent-strong)]" aria-hidden="true">1</span>
              <div className="min-w-0">
                <strong className="block text-[13px] leading-[1.35] text-[var(--text)]">Отправьте ссылку</strong>
                <p className="mt-1.5 [overflow-wrap:anywhere] text-xs leading-[1.5] text-[var(--text-muted)]">
                  Она сохраняет вас как пригласившего и ожидаемую роль нового пользователя.
                </p>
              </div>
            </li>
            <li className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] gap-[11px] border-l border-[var(--border)] px-[22px] max-[760px]:border-l-0 max-[760px]:border-t max-[760px]:px-0 max-[760px]:py-[18px]">
              <span className="grid size-[34px] place-items-center rounded-full bg-[var(--surface-subtle)] text-xs font-extrabold text-[var(--accent-strong)]" aria-hidden="true">2</span>
              <div className="min-w-0">
                <strong className="block text-[13px] leading-[1.35] text-[var(--text)]">Дождитесь целевого действия</strong>
                <p className="mt-1.5 [overflow-wrap:anywhere] text-xs leading-[1.5] text-[var(--text-muted)]">
                  {getMilestoneCopy(invite)}
                </p>
              </div>
            </li>
            <li className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] gap-[11px] border-l border-[var(--border)] pl-[22px] max-[760px]:border-l-0 max-[760px]:border-t max-[760px]:px-0 max-[760px]:pt-[18px]">
              <span className="grid size-[34px] place-items-center rounded-full bg-[var(--surface-subtle)] text-xs font-extrabold text-[var(--accent-strong)]" aria-hidden="true">3</span>
              <div className="min-w-0">
                <strong className="block text-[13px] leading-[1.35] text-[var(--text)]">Решение администратора</strong>
                <p className="mt-1.5 [overflow-wrap:anywhere] text-xs leading-[1.5] text-[var(--text-muted)]">
                  После ручного подтверждения ваша подписка продлевается на 10 дней.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </Panel>
    );
  }

  return (
    <Panel className="grid min-w-0 gap-4 p-4 sm:p-5" surface="raised">
      <div className="grid gap-1.5">
        <h2 className="text-xl font-bold tracking-[-0.025em] text-[var(--text)]">{title}</h2>
        <p className="text-sm leading-[1.55] text-[var(--text-muted)]">{description}</p>
      </div>

      {notice ? <InlineNotice aria-live="polite">{notice.message}</InlineNotice> : null}

      <div className="grid min-w-0 gap-3">
        <div className="grid min-w-0 gap-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <strong className="text-sm text-[var(--text)]">Текст приглашения</strong>
          <p className="max-w-full [overflow-wrap:anywhere] text-sm leading-[1.6] text-[var(--text-muted)]">{invite.shareMessage}</p>
        </div>
        <div className="grid min-w-0 gap-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <strong className="text-sm text-[var(--text)]">Ссылка</strong>
          <p className="max-w-full break-all font-mono text-[13px] leading-[1.6] text-[var(--text)]">{invite.inviteUrl}</p>
        </div>
        <InlineNotice tone="soft">
          Бонус не начисляется автоматически: после первого целевого действия приглашённого решение принимает администратор.
        </InlineNotice>
        <div className="flex flex-wrap gap-3 max-[480px]:grid max-[480px]:grid-cols-1">
          <Button type="button" onClick={shareInvite} size="sm">
            Поделиться
          </Button>
          <Button type="button" variant="secondary" onClick={copyInvite} size="sm">
            Скопировать
          </Button>
        </div>
      </div>
    </Panel>
  );
}
