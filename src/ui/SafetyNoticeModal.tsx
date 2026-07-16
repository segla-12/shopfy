"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { safetyNoticeAcceptedKey, safetyNoticeEventName, type SafetyNoticeDetail } from "@/lib/safetyNotice";

export function SafetyNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [hasAccepted, setHasAccepted] = useState(false);

  const { t } = useLanguage();
  useEffect(() => {
    function openNotice(event: Event) {
      const detail = event instanceof CustomEvent ? (event.detail as SafetyNoticeDetail | undefined) : undefined;
      const nextRedirectUrl = detail?.redirectUrl || "";

      if (window.sessionStorage.getItem(safetyNoticeAcceptedKey) === "true") {
        if (nextRedirectUrl) {
          window.location.assign(nextRedirectUrl);
        }

        return;
      }

      setRedirectUrl(nextRedirectUrl);
      setHasAccepted(false);
      setIsOpen(true);
    }

    window.addEventListener(safetyNoticeEventName, openNotice);

    return () => {
      window.removeEventListener(safetyNoticeEventName, openNotice);
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  function continueAfterAcceptance() {
    window.sessionStorage.setItem(safetyNoticeAcceptedKey, "true");
    setIsOpen(false);

    if (redirectUrl) {
      window.location.assign(redirectUrl);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-gray-950/75 px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shopfy-wholesale-warning-title"
        className="w-full max-w-2xl animate-[safetyNoticeIn_240ms_ease-out] rounded-lg border-2 border-orange-400 bg-white p-5 text-gray-950 shadow-2xl dark:bg-gray-950 dark:text-white"
      >
        <p id="shopfy-wholesale-warning-title" className="text-xl font-black text-gray-950 dark:text-white">
          {t("wholesale.modalTitle")}
        </p>
        <div className="mt-4 grid gap-3 text-sm font-bold leading-6 text-gray-800 dark:text-gray-100">
          <p>{t("wholesale.modalLine1")}</p>
          <p>{t("wholesale.modalLine2")}</p>
          <p className="border-l-4 border-red-500 pl-3 font-black text-red-700 dark:text-red-300">{t("wholesale.modalLine3")}</p>
        </div>
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-black text-gray-950 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-white">
          <input
            type="checkbox"
            checked={hasAccepted}
            onChange={(event) => setHasAccepted(event.target.checked)}
            className="mt-1 h-5 w-5 accent-orange-500"
          />
          <span>{t("wholesale.modalCheckbox")}</span>
        </label>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100"
          >
            {t("wholesale.modalCancel")}
          </button>
          <button
            type="button"
            onClick={continueAfterAcceptance}
            disabled={!hasAccepted}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("wholesale.modalAccept")}
          </button>
        </div>
      </section>
    </div>
  );
}
