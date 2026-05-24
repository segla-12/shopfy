"use client";

import { useEffect, useId, useState } from "react";
import { useLanguage } from "@/lib/language";

export function SafetyNoticeModal() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [isAccepted, setIsAccepted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/55 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-2xl animate-[safetyNoticeIn_240ms_ease-out] overflow-hidden rounded-3xl border border-white/70 bg-white text-gray-950 shadow-2xl shadow-gray-950/20 dark:border-white/10 dark:bg-gray-950 dark:text-white"
      >
        <div className="grid gap-5 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-600 shadow-sm dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <path
                  d="M12 3.25 5.25 6.1v5.35c0 4.2 2.75 7.85 6.75 9.05 4-1.2 6.75-4.85 6.75-9.05V6.1L12 3.25Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 8v5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M12 16.5h.01"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-orange-500 dark:text-orange-300">
                {t("safety.kicker")}
              </p>
              <h2 id={titleId} className="mt-1 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl dark:text-white">
                {t("safety.title")}
              </h2>
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-gray-600 sm:text-base dark:text-gray-300">
                {t("safety.intro")}
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
            <p>{t("safety.noAdvancePayment")}</p>
            <p>{t("safety.precautions")}</p>
            <p>{t("safety.marketplaceRole")}</p>
            <p>{t("safety.disclaimer")}</p>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <input
              type="checkbox"
              checked={isAccepted}
              onChange={(event) => setIsAccepted(event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 accent-orange-500"
            />
            <span className="text-sm font-bold leading-6 text-gray-800 dark:text-gray-100">
              {t("safety.checkbox")}
            </span>
          </label>

          <button
            type="button"
            disabled={!isAccepted}
            onClick={() => setIsOpen(false)}
            className="min-h-12 w-full rounded-full bg-orange-500 px-5 text-sm font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-white/10 dark:disabled:text-gray-500"
          >
            {t("safety.continue")}
          </button>
        </div>
      </section>
    </div>
  );
}
