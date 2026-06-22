import { BrandLogo } from "@/shared/ui";

type PublicBrandSlotProps = {
  href?: string;
  className?: string;
};

export function PublicBrandSlot({ href = "/", className }: PublicBrandSlotProps) {
  return <BrandLogo href={href} className={className} />;
}
