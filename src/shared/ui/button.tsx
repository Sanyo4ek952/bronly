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

function getVariantClass(variant: ButtonVariant) {
  switch (variant) {
    case "secondary":
      return "br-button--secondary";
    case "danger":
      return "br-button--danger";
    case "ghost":
      return "br-button--ghost";
    default:
      return "br-button--primary";
  }
}

function getSizeClass(size: ButtonSize) {
  switch (size) {
    case "sm":
      return "br-button--sm";
    default:
      return "br-button--md";
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
        "br-button",
        getVariantClass(variant),
        getSizeClass(size),
        fullWidth && "br-button--full",
        loadingState && "br-button--loading",
        className,
      )}
      disabled={disabled || loadingState}
      {...props}
    >
      <span className="br-button__content">
        <span className={cn("br-button__label", loadingState && "br-button__label--hidden")}>{children}</span>
        {loadingState ? (
          <span className="br-button__spinner-wrap" aria-hidden="true">
            <span className="br-button__spinner" />
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
        "br-button",
        getVariantClass(variant),
        getSizeClass(size),
        fullWidth && "br-button--full",
        className,
      )}
    >
      {children}
    </Link>
  );
}
