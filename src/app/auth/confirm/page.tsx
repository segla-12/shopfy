"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language";
import { supabase, syncServerAuthSession } from "@/lib/supabase";

type SupportedOtpType = "signup" | "recovery" | "email_change" | "email" | "magiclink" | "invite";

const supportedOtpTypes = new Set<SupportedOtpType>([
  "signup",
  "recovery",
  "email_change",
  "email",
  "magiclink",
  "invite",
]);

function getSafeNextPath(nextPath: string | null, fallbackPath: string) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath.includes("\\")) {
    return fallbackPath;
  }

  return nextPath;
}

function getOtpType(type: string | null): SupportedOtpType {
  if (type && supportedOtpTypes.has(type as SupportedOtpType)) {
    return type as SupportedOtpType;
  }

  return "email";
}

function AuthConfirmContent() {
  const { language } = useLanguage();
  const copy = getConfirmCopy(language);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const tokenHash = searchParams.get("token_hash");
  const type = getOtpType(searchParams.get("type"));
  const fallbackPath = type === "recovery" ? "/auth?reset=1" : "/dashboard";
  const nextPath = useMemo(
    () => getSafeNextPath(searchParams.get("next"), fallbackPath),
    [fallbackPath, searchParams],
  );

  async function confirmEmail() {
    setErrorMessage("");

    if (!tokenHash) {
      setErrorMessage(copy.missingToken);
      return;
    }

    setIsConfirming(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error(copy.missingSession);
      }

      await syncServerAuthSession(data.session.access_token);
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.genericError);
      setIsConfirming(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-10 transition-colors dark:bg-gray-950">
      <section className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <p className="text-xs font-black uppercase tracking-wide text-orange-500">{copy.kicker}</p>
        <h1 className="mt-2 text-2xl font-black text-gray-950 dark:text-white">
          {errorMessage ? copy.errorTitle : copy.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
          {errorMessage || copy.text}
        </p>
        {errorMessage ? (
          <Link
            href="/auth"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {copy.backToAuth}
          </Link>
        ) : (
          <button
            type="button"
            onClick={confirmEmail}
            disabled={isConfirming || !tokenHash}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConfirming ? copy.confirming : copy.confirmAction}
          </button>
        )}
      </section>
    </main>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<AuthConfirmFallback />}>
      <AuthConfirmContent />
    </Suspense>
  );
}

function AuthConfirmFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-10 transition-colors dark:bg-gray-950">
      <section className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <p className="text-sm font-bold text-gray-500 dark:text-gray-300">Confirmation en cours...</p>
      </section>
    </main>
  );
}

function getConfirmCopy(language: string) {
  if (language === "fr") {
    return {
      kicker: "Confirmation",
      title: "Validation du compte",
      text: "Cliquez sur le bouton pour confirmer votre compte vendeur Shopfy.",
      confirmAction: "Confirmer mon compte",
      confirming: "Confirmation...",
      errorTitle: "Lien invalide ou expire",
      backToAuth: "Retour au compte vendeur",
      missingToken: "Le lien de confirmation est incomplet. Demandez un nouveau lien.",
      missingSession: "Le compte a ete confirme, mais aucune session valide n'a ete creee.",
      genericError: "Impossible de confirmer ce compte. Demandez un nouveau lien.",
    };
  }

  return {
    kicker: "Confirmation",
    title: "Confirming account",
    text: "Click the button to confirm your Shopfy seller account.",
    confirmAction: "Confirm my account",
    confirming: "Confirming...",
    errorTitle: "Invalid or expired link",
    backToAuth: "Back to seller account",
    missingToken: "The confirmation link is incomplete. Request a new link.",
    missingSession: "The account was confirmed, but no valid session was created.",
    genericError: "Unable to confirm this account. Request a new link.",
  };
}
