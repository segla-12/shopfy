"use client";

import { useLanguage } from "@/lib/language";
import { buildWhatsAppLink, isValidWhatsappPhone } from "@/lib/whatsapp";

type WhatsappButtonProps = {
  phone: string;
  className?: string;
  label?: string;
};

export function WhatsappButton({ phone, className = "", label }: WhatsappButtonProps) {
  const { t } = useLanguage();
  const buttonLabel = label || t("product.order");
  
  // Vérifier si le numéro est valide
  const isPhoneValid = isValidWhatsappPhone(phone);
  
  if (!isPhoneValid) {
    // Bouton désactivé si aucun numéro de téléphone valide
    return (
      <button
        disabled
        title={t("whatsapp.noPhoneError") || "Numéro de téléphone non disponible"}
        className={`inline-flex min-h-10 items-center justify-center rounded-full bg-gray-300 px-4 text-sm font-black text-gray-500 cursor-not-allowed opacity-50 dark:bg-gray-600 dark:text-gray-400 ${className}`}
      >
        {buttonLabel}
      </button>
    );
  }

  const orderHref = buildWhatsAppLink(phone, t("whatsapp.message"));

  return (
    <a
      href={orderHref}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-10 items-center justify-center rounded-full bg-green-500 px-4 text-sm font-black text-white transition hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 ${className}`}
    >
      {buttonLabel}
    </a>
  );
}
