"use client";

import { SHOPFY_SUPPORT_WHATSAPP } from "@/lib/support";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { ReactNode } from "react";

type AdminWhatsappButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  message?: string;
};

export function AdminWhatsappButton({ children, className, disabled, message }: AdminWhatsappButtonProps) {
  const href = buildWhatsAppLink(SHOPFY_SUPPORT_WHATSAPP, message);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-disabled={disabled}>
      {children}
    </a>
  );
}
