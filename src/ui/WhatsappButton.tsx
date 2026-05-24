"use client";

import { useLanguage } from "@/lib/language";
import { createWhatsappUrl } from "@/lib/whatsapp";

type WhatsappButtonProps = {
  phone: string;
  className?: string;
  label?: string;
};

export function WhatsappButton({ phone, className = "", label }: WhatsappButtonProps) {
  const { t } = useLanguage();
  const buttonLabel = label || t("product.order");

  return (
    <a
      href={createWhatsappUrl(phone, t("whatsapp.message"))}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex min-h-10 items-center justify-center rounded-full bg-green-500 px-4 text-sm font-black text-white transition hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 ${className}`}
    >
      {buttonLabel}
    </a>
  );
}
