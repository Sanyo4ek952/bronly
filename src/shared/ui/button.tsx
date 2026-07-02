import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  loading?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const buttonBaseClass = cn(
  "relative inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-transparent",
  "px-4 text-[13px] font-bold leading-none no-underline transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms]",
  "focus-visible:outline-none focus-visible:border-[rgb(var(--color-primary-rgb)_/_0.44)] focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]",
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none",
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
      return "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]";
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
      <span className="relative inline-grid w-full place-items-center">
        <span className={cn("inline-flex min-w-0 items-center justify-center", loadingState && "invisible")}>{children}</span>
        {loadingState ? (
          <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  className,
  fullWidth = false,
  variant = "primary",
  size = "md",
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        buttonBaseClass,
        getVariantClass(variant),
        getSizeClass(size),
        fullWidth && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}
