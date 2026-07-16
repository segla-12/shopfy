"use client";

import type { Product } from "@/types/marketplace";
import { useLanguage } from "@/lib/language";
import { buildWhatsAppShareLink } from "@/lib/whatsapp";

type WhatsappShareButtonProps = {
  product: Product;
  className?: string;
  compact?: boolean;
};

export function WhatsappShareButton({ product, className = "", compact = false }: WhatsappShareButtonProps) {
  const { t } = useLanguage();

  function shareProduct() {
    const productUrl = `${window.location.origin}/product/${encodeURIComponent(product.id)}`;
    const message = `${product.title} - ${productUrl}`;
    window.open(buildWhatsAppShareLink(message), "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={shareProduct}
      aria-label={t("product.shareWhatsapp")}
      className={`inline-flex items-center justify-center rounded-full border border-green-100 bg-green-50 text-sm font-black text-green-700 shadow-sm transition hover:border-green-200 hover:bg-green-100 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300 ${
        compact ? "h-10 w-10" : "min-h-10 gap-2 px-4"
      } ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M12.04 2C6.58 2 2.14 6.43 2.14 11.88c0 1.74.46 3.44 1.33 4.94L2 22l5.31-1.39a9.86 9.86 0 0 0 4.73 1.2h.01c5.45 0 9.89-4.43 9.89-9.88C21.94 6.44 17.5 2 12.04 2Zm0 18.13h-.01a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.15.83.84-3.07-.2-.32a8.14 8.14 0 0 1-1.25-4.37c0-4.52 3.69-8.2 8.24-8.2 2.2 0 4.27.86 5.82 2.41a8.15 8.15 0 0 1 2.42 5.82c0 4.53-3.69 8.22-8.24 8.22Zm4.51-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.12-.17.25-.64.8-.79.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.02 2.57.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29Z" />
      </svg>
      {compact ? null : <span>{t("product.shareWhatsapp")}</span>}
    </button>
  );
}
