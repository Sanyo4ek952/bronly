import Link from "next/link";

import { cn } from "@/shared/lib/cn";

type BrandLogoProps = {
  href?: string;
  className?: string;
};

export function BrandLogo({ href = "/", className }: BrandLogoProps) {
  return (
    <Link
      href={href === "/" ? "/home" : href}
      prefetch={href === "/" ? false : undefined}
      className={cn("inline-flex items-center gap-2.5 text-lg font-extrabold tracking-normal text-[var(--color-text)]", className)}
    >
      <span
        className="grid size-7 place-items-center rounded-[9px] bg-[var(--color-primary)] text-[13px] font-extrabold uppercase text-white"
        aria-hidden="true"
      >
        b
      </span>
      <span>
        Bron<span className="text-[var(--color-primary)]">ly</span>
      </span>
    </Link>
  );
}
