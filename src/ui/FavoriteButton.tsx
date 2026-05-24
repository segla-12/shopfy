"use client";

import { useFavorites } from "@/lib/favorites";
import { useLanguage } from "@/lib/language";

type FavoriteButtonProps = {
  productId: string;
  className?: string;
  compact?: boolean;
};

export function FavoriteButton({ productId, className = "", compact = false }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const active = isFavorite(productId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? t("product.removeFavorite") : t("product.addFavorite")}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(productId);
      }}
      className={`inline-flex items-center justify-center rounded-full border shadow-sm transition duration-200 active:scale-90 ${
        compact ? "h-10 w-10" : "min-h-10 gap-2 px-4 text-sm font-black"
      } ${
        active
          ? "border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300"
          : "border-gray-200 bg-white text-gray-500 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"
      } ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`h-5 w-5 transition-transform duration-200 ${active ? "scale-110 fill-current" : "fill-none"}`}
      >
        <path
          d="M12 20.25s-7.5-4.42-7.5-10.17A4.3 4.3 0 0 1 8.83 5.75 4.72 4.72 0 0 1 12 7.08a4.72 4.72 0 0 1 3.17-1.33 4.3 4.3 0 0 1 4.33 4.33c0 5.75-7.5 10.17-7.5 10.17Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      {compact ? null : <span>{active ? t("product.removeFavorite") : t("product.addFavorite")}</span>}
    </button>
  );
}
