import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-2", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-graphite-700", className)} {...props} />;
}

export function FieldError({ className, children, ...props }: React.ComponentProps<"p">) {
  if (!children) {
    return null;
  }

  return (
    <p className={cn("text-sm font-medium text-destructive", className)} {...props}>
      {children}
    </p>
  );
}
