"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/shared/ui/button";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "loading" | "isLoading" | "type"> & {
  pendingLabel?: string;
};

export function SubmitButton({ children, disabled, pendingLabel = "Загрузка", ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} type="submit" disabled={disabled || pending} isLoading={pending} loadingLabel={pendingLabel}>
      {children}
    </Button>
  );
}
