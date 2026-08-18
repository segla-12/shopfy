"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type StoreProductImageProps = {
  src?: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  fallbackLabel?: string;
};

export function StoreProductImage({ src = "", alt, sizes, className, priority = false, fallbackLabel = "Shopfy" }: StoreProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imageSrc = !hasError && src ? src : "";
  const isLocalImage = imageSrc.startsWith("data:");

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  if (!imageSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex h-full w-full items-center justify-center bg-gray-100 text-[10px] font-black uppercase text-gray-400 dark:bg-gray-950 dark:text-gray-600"
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <>
      {!isLoaded ? (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-950">
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-gray-950 dark:via-white/10 dark:to-gray-950" />
        </div>
      ) : null}
      <Image
        src={imageSrc}
        alt={alt}
        fill
        priority={priority}
        unoptimized={isLocalImage}
        sizes={sizes}
        className={`${className || ""} transition-opacity duration-200 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </>
  );
}
