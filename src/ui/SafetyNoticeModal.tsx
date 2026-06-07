"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/language";
import { safetyNoticeEventName, type SafetyNoticeDetail } from "@/lib/safetyNotice";

const noticeDelay = 7000;

export function SafetyNoticeModal() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const noticeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function clearPendingNotice() {
      if (noticeTimeoutRef.current) {
        window.clearTimeout(noticeTimeoutRef.current);
        noticeTimeoutRef.current = null;
      }
    }

    function openNotice(event: Event) {
      const detail = event instanceof CustomEvent ? (event.detail as SafetyNoticeDetail | undefined) : undefined;
      const nextRedirectUrl = detail?.redirectUrl || "";

      clearPendingNotice();
      setIsOpen(true);

      noticeTimeoutRef.current = window.setTimeout(() => {
        if (nextRedirectUrl) {
          window.location.assign(nextRedirectUrl);
          return;
        }

        setIsOpen(false);
      }, noticeDelay);
    }

    window.addEventListener(safetyNoticeEventName, openNotice);

    return () => {
      window.removeEventListener(safetyNoticeEventName, openNotice);
      clearPendingNotice();
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex justify-center sm:inset-x-auto sm:right-4 sm:justify-end">
      <section
        role="alert"
        className="flex w-full max-w-xl animate-[safetyNoticeIn_240ms_ease-out] rounded-lg border border-orange-200 bg-white/95 px-4 py-3 text-gray-950 shadow-lg shadow-gray-950/10 backdrop-blur dark:border-orange-400/20 dark:bg-gray-950/95 dark:text-white"
      >
        <p className="whitespace-pre-wrap text-sm font-bold leading-5 text-gray-700 dark:text-gray-200">{t("safety.banner")}</p>
      </section>
    </div>
  );
}
