"use client";

import { useState } from "react";

import type { ReferralInviteSummary } from "@/entities/referral";
import { Button, InlineNotice, Panel } from "@/shared/ui";

type ReferralShareCardProps = {
  invite: ReferralInviteSummary;
  title: string;
  description: string;
};

export function ReferralShareCard({ invite, title, description }: ReferralShareCardProps) {
  const [notice, setNotice] = useState("");

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(`${invite.shareMessage}\n\n${invite.inviteUrl}`);
      setNotice("Ссылка и текст приглашения скопированы.");
    } catch {
      setNotice("Не удалось скопировать автоматически. Скопируйте ссылку вручную.");
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
      setNotice("Приглашение готово к отправке.");
    } catch {
      setNotice("");
    }
  }

  return (
    <Panel className="grid min-w-0 gap-4 p-4 sm:p-5" surface="raised">
      <div className="grid gap-1.5">
        <h2 className="text-xl font-bold tracking-[-0.025em] text-[var(--text)]">{title}</h2>
        <p className="text-sm leading-[1.55] text-[var(--text-muted)]">{description}</p>
      </div>

      {notice ? <InlineNotice aria-live="polite">{notice}</InlineNotice> : null}

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
