"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  const { language, t } = useLanguage();
  const privacyLabel = language === "fr" ? "Politique de confidentialite" : "Privacy Policy";
  const termsLabel = language === "fr" ? "Conditions d'utilisation" : "Terms of Service";

  return (
    <footer className="border-t border-gray-100 bg-white transition-colors dark:border-white/10 dark:bg-gray-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-5 px-4 py-8 text-center text-sm text-gray-500 md:flex-row md:justify-between md:text-left">
        <div className="grid gap-1">
          <Link href="/" className="inline-flex w-[146px] justify-self-center transition hover:opacity-80 md:justify-self-start" aria-label="Shopfy">
            <BrandLogo sizes="146px" className="h-12 w-auto" />
          </Link>
          <p className="font-semibold text-gray-600">{t("footer.rights")}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
            <Link
              href="/privacy"
              className="font-black text-gray-700 underline decoration-orange-300 underline-offset-4 transition hover:text-orange-500 dark:text-gray-200"
            >
              {privacyLabel}
            </Link>
            <Link
              href="/terms"
              className="font-black text-gray-700 underline decoration-orange-300 underline-offset-4 transition hover:text-orange-500 dark:text-gray-200"
            >
              {termsLabel}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <a
            href="https://wa.me/2290149341219"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-600 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-100 hover:text-green-700"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12.04 2C6.58 2 2.14 6.43 2.14 11.88c0 1.74.46 3.44 1.33 4.94L2 22l5.31-1.39a9.86 9.86 0 0 0 4.73 1.2h.01c5.45 0 9.89-4.43 9.89-9.88C21.94 6.44 17.5 2 12.04 2Zm0 18.13h-.01a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.15.83.84-3.07-.2-.32a8.14 8.14 0 0 1-1.25-4.37c0-4.52 3.69-8.2 8.24-8.2 2.2 0 4.27.86 5.82 2.41a8.15 8.15 0 0 1 2.42 5.82c0 4.53-3.69 8.22-8.24 8.22Zm4.51-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.12-.17.25-.64.8-.79.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.02 2.57.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29Z" />
            </svg>
          </a>

          <a
            href="https://www.facebook.com/profile.php?id=61588840275108"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
