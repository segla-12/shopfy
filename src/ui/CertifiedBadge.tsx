"use client";

import { useLanguage } from "@/lib/language";

type CertifiedBadgeProps = {
  className?: string;
  label?: string;
};

export function CertifiedBadge({ className = "", label }: CertifiedBadgeProps) {
  const { t } = useLanguage();

  return (
    <span
      className={`inline-flex min-h-7 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 shadow-sm ${className}`}
    >
      {label || t("certified.badge")}
    </span>
  );
}
