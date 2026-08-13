"use client";

import { SHOPFY_SUPPORT_WHATSAPP } from "@/lib/support";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { ReactNode } from "react";

type AdminWhatsappButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  message?: string;
  phone?: string;
};

export function AdminWhatsappButton({ children, className, disabled, message, phone }: AdminWhatsappButtonProps) {
  const href = buildWhatsAppLink(phone || SHOPFY_SUPPORT_WHATSAPP, message);
  const isDisabled = disabled || !href;

  return (
    <a
      href={isDisabled ? undefined : href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-disabled={isDisabled}
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </a>
  );
}
