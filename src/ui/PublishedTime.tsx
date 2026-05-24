"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language";

type PublishedTimeProps = {
  date?: string;
  className?: string;
};

export function PublishedTime({ date, className = "" }: PublishedTimeProps) {
  const { language, t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const label = useMemo(() => {
    if (!date) {
      return "";
    }

    return formatElapsedTime(date, now, language, t("time.justNow"));
  }, [date, language, now, t]);

  if (!label) {
    return null;
  }

  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-black text-gray-500 dark:bg-white/5 dark:text-gray-300 ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
        <path
          d="M12 7v5l3 2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
      {label}
    </span>
  );
}

function formatElapsedTime(date: string, now: number, language: "fr" | "en", justNowLabel: string) {
  const publishedAt = new Date(date).getTime();

  if (!Number.isFinite(publishedAt)) {
    return "";
  }

  const elapsedMs = Math.max(0, now - publishedAt);
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);

  if (elapsedMinutes < 1) {
    return justNowLabel;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedDays = Math.floor(elapsedHours / 24);
  const formatter = new Intl.RelativeTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
    numeric: "always",
  });

  if (elapsedMinutes < 60) {
    return capitalize(formatter.format(-elapsedMinutes, "minute"));
  }

  if (elapsedHours < 24) {
    return capitalize(formatter.format(-elapsedHours, "hour"));
  }

  if (elapsedDays < 7) {
    return capitalize(formatter.format(-elapsedDays, "day"));
  }

  if (elapsedDays < 21) {
    return capitalize(formatter.format(-Math.floor(elapsedDays / 7), "week"));
  }

  if (elapsedDays < 30) {
    return capitalize(formatter.format(-elapsedDays, "day"));
  }

  if (elapsedDays < 365) {
    return capitalize(formatter.format(-Math.floor(elapsedDays / 30), "month"));
  }

  return capitalize(formatter.format(-Math.floor(elapsedDays / 365), "year"));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
