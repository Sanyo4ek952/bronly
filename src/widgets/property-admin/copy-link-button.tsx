"use client";

import { useState } from "react";

import { Button } from "@/shared/ui";

type CopyLinkButtonProps = {
  path: string;
  disabled?: boolean;
};

export function CopyLinkButton({ path, disabled = false }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (disabled) {
      return;
    }

    const url = path.startsWith("http") ? path : `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="secondary" onClick={() => void handleCopy()} disabled={disabled}>
      {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
    </Button>
  );
}
