"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";

import { Button } from "@/shared/ui/button";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "loading" | "type"> & {
  pendingLabel?: string;
};

export function SubmitButton({ children, disabled, pendingLabel = "Загрузка", ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} type="submit" disabled={disabled || pending} loading={pending} loadingLabel={pendingLabel}>
      {children}
    </Button>
  );
}
