"use client";

import Image from "next/image";
import { useState } from "react";

const fallbackProductImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80";

type StoreProductImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
};

export function StoreProductImage({ src, alt, sizes, className }: StoreProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = !hasError && src ? src : fallbackProductImage;
  const isLocalImage = imageSrc.startsWith("data:");

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
