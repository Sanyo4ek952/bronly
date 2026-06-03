import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  className?: string;
};

export function BrandLogo({ href = "/", className }: BrandLogoProps) {
  return (
    <Link href={href} className={["br-logo", className].filter(Boolean).join(" ")}>
      <span className="br-logo__mark" aria-hidden="true">
        b
      </span>
      <span className="br-logo__wordmark">
        Bron<span className="br-logo__accent">ly</span>
      </span>
    </Link>
  );
}
