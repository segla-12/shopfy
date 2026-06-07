"use client";

import { useLanguage } from "@/lib/language";
import { showSafetyNotice } from "@/lib/safetyNotice";
import { createWhatsappUrl } from "@/lib/whatsapp";

type WhatsappButtonProps = {
  phone: string;
  className?: string;
  label?: string;
};

export function WhatsappButton({ phone, className = "", label }: WhatsappButtonProps) {
  const { t } = useLanguage();
  const buttonLabel = label || t("product.order");
  const orderHref = createWhatsappUrl(phone, t("whatsapp.message"));

  return (
    <a
      href={orderHref}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        event.preventDefault();
        showSafetyNotice(orderHref);
      }}
      className={`inline-flex min-h-10 items-center justify-center rounded-full bg-green-500 px-4 text-sm font-black text-white transition hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 ${className}`}
    >
      {buttonLabel}
    </a>
  );
}
