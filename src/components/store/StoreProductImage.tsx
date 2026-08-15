"use client";

import Image from "next/image";
import { useState } from "react";

type StoreProductImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
};

export function StoreProductImage({ src, alt, sizes, className }: StoreProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = !hasError && src ? src : "";
  const isLocalImage = imageSrc.startsWith("data:");

  if (!imageSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex h-full w-full items-center justify-center bg-gray-100 text-[10px] font-black uppercase text-gray-400 dark:bg-gray-950 dark:text-gray-600"
      >
        Shopfy
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      unoptimized={isLocalImage}
      sizes={sizes}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
