"use client";

import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { ReactNode } from "react";

type AdminWhatsappButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

const ADMIN_WHATSAPP_PHONE = "+22956262626";

export function AdminWhatsappButton({ children, className, disabled }: AdminWhatsappButtonProps) {
  const href = buildWhatsAppLink(ADMIN_WHATSAPP_PHONE);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-disabled={disabled}>
      {children}
    </a>
  );
}