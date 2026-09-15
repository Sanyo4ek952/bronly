import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md";

type ButtonVisualProps = {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  isLoading?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "children" | "className" | "onClick"> & ButtonVisualProps & {
  disabled?: boolean;
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonVisualProps;

const buttonBaseClass = cn(
  "relative inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-transparent",
  "px-4 text-[13px] font-bold leading-none no-underline transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms]",
  "focus-visible:outline-none focus-visible:border-[rgb(var(--color-primary-rgb)_/_0.44)] focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]",
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none disabled:hover:translate-y-0",
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:transform-none aria-disabled:hover:translate-y-0",
  "hover:-translate-y-px active:translate-y-0",
);

function getVariantClass(variant: ButtonVariant) {
  switch (variant) {
    case "secondary":
      return cn(
        "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
        "hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)]",
      );
    case "danger":
      return cn(
        "border-[rgb(196_81_81_/_0.18)] bg-[rgb(196_81_81_/_0.08)] text-[var(--danger)]",
        "hover:border-[rgb(196_81_81_/_0.28)] hover:bg-[rgb(196_81_81_/_0.14)]",
      );
    case "ghost":
      return cn(
        "border-transparent bg-transparent text-[var(--text-muted)] shadow-none",
        "hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)] hover:text-[var(--text)]",
      );
    default:
      return "bg-[var(--accent)] !text-white hover:bg-[var(--accent-strong)]";
  }
}

function getSizeClass(size: ButtonSize) {
  switch (size) {
    case "sm":
      return "min-h-[34px] px-3 text-xs";
    default:
      return "min-h-10";
  }
}

function ButtonContent({ children, loading }: { children: ReactNode; loading: boolean }) {
  return (
    <span className="relative inline-grid w-full place-items-center">
      <span className={cn("inline-flex min-w-0 items-center justify-center", loading && "invisible")}>{children}</span>
      {loading ? (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        </span>
      ) : null}
    </span>
  );
}

export function Button({
  children,
  className,
  disabled,
  fullWidth = false,
  loading = false,
  isLoading,
  loadingLabel = "Загрузка",
  variant = "primary",
  size = "md",
  type = "button",
  "aria-label": ariaLabel,
  ...props
}: ButtonProps) {
  const loadingState = isLoading ?? loading;

  return (
    <button
      type={type}
      aria-busy={loadingState || undefined}
      aria-label={loadingState ? loadingLabel : ariaLabel}
      className={cn(
        buttonBaseClass,
        getVariantClass(variant),
        getSizeClass(size),
        fullWidth && "w-full",
        loadingState && "pointer-events-none",
        className,
      )}
      disabled={disabled || loadingState}
      {...props}
    >
      <ButtonContent loading={loadingState}>{children}</ButtonContent>
    </button>
  );
}

export function ButtonLink({
  children,
  className,
  disabled = false,
  fullWidth = false,
  isLoading,
  loading = false,
  loadingLabel = "Загрузка",
  variant = "primary",
  size = "md",
  tabIndex,
  ...props
}: ButtonLinkProps) {
  const loadingState = isLoading ?? loading;
  const unavailable = disabled || loadingState;

  return (
    <Link
      {...props}
      aria-busy={loadingState || undefined}
      aria-disabled={unavailable || undefined}
      aria-label={loadingState ? loadingLabel : props["aria-label"]}
      className={cn(
        buttonBaseClass,
        getVariantClass(variant),
        getSizeClass(size),
        fullWidth && "w-full",
        unavailable && "pointer-events-none",
        className,
      )}
      tabIndex={unavailable ? -1 : tabIndex}
    >
      <ButtonContent loading={loadingState}>{children}</ButtonContent>
    </Link>
  );
}
