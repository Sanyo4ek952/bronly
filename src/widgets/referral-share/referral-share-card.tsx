"use client";

import { useState } from "react";

import type { ReferralInviteSummary } from "@/entities/referral";
import { Button } from "@/shared/ui";

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
    <section className="br-dashboard-block br-card">
      <div className="br-dashboard-block__header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {notice ? <div className="br-inline-notice">{notice}</div> : null}

      <div className="br-owner-stack">
        <div className="br-owner-editor br-owner-editor--muted">
          <strong>Текст приглашения</strong>
          <p>{invite.shareMessage}</p>
        </div>
        <div className="br-owner-editor br-owner-editor--muted">
          <strong>Ссылка</strong>
          <p>{invite.inviteUrl}</p>
        </div>
        <div className="br-owner-actions">
          <Button type="button" onClick={shareInvite}>
            Открыть системный share
          </Button>
          <Button type="button" variant="secondary" onClick={copyInvite}>
            Скопировать ссылку
          </Button>
        </div>
      </div>
    </section>
  );
}
