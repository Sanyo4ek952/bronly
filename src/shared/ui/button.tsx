import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  variant?: ButtonVariant;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  variant?: ButtonVariant;
};

function getVariantClass(variant: ButtonVariant) {
  switch (variant) {
    case "secondary":
      return "br-button--secondary";
    case "danger":
      return "br-button--ghost-danger";
    default:
      return "br-button--primary";
  }
}

export function Button({
  children,
  className,
  fullWidth = false,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn("br-button", getVariantClass(variant), fullWidth && "br-button--full", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  className,
  fullWidth = false,
  variant = "primary",
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn("br-button", getVariantClass(variant), fullWidth && "br-button--full", className)}
    >
      {children}
    </Link>
  );
}
