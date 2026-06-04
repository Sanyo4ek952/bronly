import type { LucideIcon, LucideProps } from "lucide-react";

import { cn } from "@/shared/lib/cn";

type AppIconProps = Omit<LucideProps, "ref"> & {
  icon: LucideIcon;
};

export type AppIconComponent = LucideIcon;

export function AppIcon({ icon: Icon, className, strokeWidth = 1.9, ...props }: AppIconProps) {
  return <Icon className={cn("br-ui-icon", className)} strokeWidth={strokeWidth} {...props} />;
}
