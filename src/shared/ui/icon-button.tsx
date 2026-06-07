import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function IconButton({ children, className, type = "button", ...props }: IconButtonProps) {
  return (
    <button type={type} className={cn("br-icon-button", className)} {...props}>
      {children}
    </button>
  );
}
