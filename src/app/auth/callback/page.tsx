"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { supabase } from "@/lib/supabase";

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath.includes("\\")) {
    return "/dashboard";
  }

  return nextPath;
}

function getHashError() {
  if (typeof window === "undefined" || !window.location.hash) {
    return "";
  }

  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  return hashParams.get("error_description") || hashParams.get("error") || "";
}

function AuthCallbackContent() {
  const { language } = useLanguage();
  const copy = getCallbackCopy(language);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function completeAuthCallback() {
      const queryError = searchParams.get("error_description") || searchParams.get("error");
      const authError = queryError || getHashError();

      if (authError) {
        throw new Error(authError);
      }

      const code = searchParams.get("code");

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw error;
        }

        if (!data.session) {
          throw new Error(copy.missingSession);
        }
      } else {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!data.session) {
          throw new Error(copy.missingSession);
        }
      }

      if (!isActive) {
        return;
      }

      router.replace(getSafeNextPath(searchParams.get("next")));
      router.refresh();
    }

    completeAuthCallback().catch((error) => {
      if (!isActive) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : copy.genericError);
    });

    return () => {
      isActive = false;
    };
  }, [copy.genericError, copy.missingSession, router, searchParams]);

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
        ) : null}
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-10 transition-colors dark:bg-gray-950">
      <section className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        <p className="text-sm font-bold text-gray-500 dark:text-gray-300">Connexion en cours...</p>
      </section>
    </main>
  );
}

function getCallbackCopy(language: string) {
  if (language === "fr") {
    return {
      kicker: "Autorisation",
      title: "Connexion en cours",
      text: "Nous finalisons votre session vendeur.",
      errorTitle: "Connexion impossible",
      backToAuth: "Retour au compte vendeur",
      missingSession: "Aucune session valide n'a ete trouvee. Reconnectez-vous pour continuer.",
      genericError: "Impossible de finaliser l'authentification.",
    };
  }

  return {
    kicker: "Authorization",
    title: "Signing you in",
    text: "We are finalizing your seller session.",
    errorTitle: "Sign-in failed",
    backToAuth: "Back to seller account",
    missingSession: "No valid session was found. Sign in again to continue.",
    genericError: "Unable to complete authentication.",
  };
}
