import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function BrandLogo({ className = "", priority = false, sizes = "160px" }: BrandLogoProps) {
  const imageClassName = ["block object-contain", className].filter(Boolean).join(" ");

  return (
    <Image
      src="/shopfy-logo-clean.png"
      alt="Shopfy"
      width={640}
      height={210}
      priority={priority}
      sizes={sizes}
      className={imageClassName}
    />
  );
}
