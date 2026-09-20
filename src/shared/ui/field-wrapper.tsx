import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type FieldWrapperProps = {
  label?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  description?: string;
  error?: string;
  descriptionId?: string;
  errorId?: string;
};

export function FieldWrapper({
  label,
  htmlFor,
  children,
  className,
  description,
  error,
  descriptionId,
  errorId,
}: FieldWrapperProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <label className="mb-0.5 text-[var(--label-size)] font-bold leading-[1.4] text-[var(--text-muted)]" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? <span id={errorId} className="text-xs leading-[1.45] text-[var(--danger)]" role="alert">{error}</span> : null}
      {!error && description ? <span id={descriptionId} className="text-xs leading-[1.45] text-[var(--text-muted)]">{description}</span> : null}
    </div>
  );
}

export function getFieldDescribedBy(messageId: string | undefined, describedBy: string | undefined) {
  return [messageId, describedBy].filter(Boolean).join(" ") || undefined;
}
