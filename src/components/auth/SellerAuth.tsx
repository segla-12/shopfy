"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { supabase } from "@/lib/supabase";

type AuthMode = "signin" | "signup" | "reset";

export function SellerAuth() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = getAuthCopy(language);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthSubmitting, setIsOAuthSubmitting] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const isRecoveryRequest = window.location.search.includes("reset=1");
      setIsPasswordRecovery(isRecoveryRequest);
      supabase.auth.getSession().then(({ data }) => {
        setUserEmail(data.session?.user.email || "");
        setIsLoading(false);

        if (data.session && !isRecoveryRequest && hasRequestedNextPath()) {
          router.replace(getRequestedNextPath("/dashboard"));
          router.refresh();
        }
      });
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
        setMessage("");
        setErrorMessage("");
      }

      setUserEmail(session?.user.email || "");
      setIsLoading(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      data.subscription.unsubscribe();
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const nextPath = getRequestedNextPath("/dashboard");

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: getAuthCallbackUrl("/auth?reset=1"),
        });

        if (error) {
          throw error;
        }

        setMessage(copy.resetEmailSent);
        return;
      }

      const authResponse = mode === "signup"
        ? await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: getAuthCallbackUrl(nextPath),
          },
        })
        : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

      if (authResponse.error) {
        throw authResponse.error;
      }

      setEmail(normalizedEmail);
      setPassword("");

      if (authResponse.data.session) {
        router.replace(nextPath);
        router.refresh();
        return;
      }

      setMessage(mode === "signup" ? copy.signupSuccess : copy.signinSuccess);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (newPassword.length < 6) {
      setErrorMessage(copy.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(copy.passwordsMismatch);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordRecovery(false);
      setMessage(copy.passwordUpdated);
      window.history.replaceState({}, "", "/auth");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithGmail() {
    setMessage("");
    setErrorMessage("");
    setIsOAuthSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthCallbackUrl(getRequestedNextPath("/dashboard")),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setIsOAuthSubmitting(false);
      setErrorMessage(error instanceof Error ? error.message : copy.genericError);
    }
  }

  async function signOut() {
    setMessage("");
    setErrorMessage("");
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(copy.signedOut);
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
      <div className="grid gap-3">
        <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.kicker}</p>
        <h1 className="text-3xl font-black tracking-tight text-gray-950 md:text-5xl dark:text-white">{copy.title}</h1>
        <p className="max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">{copy.description}</p>
        <div className="mt-2 grid gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
          <p>{copy.ruleStores}</p>
          <p>{copy.ruleProducts}</p>
          <p>{copy.rulePublic}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
        {isLoading ? (
          <p className="text-sm font-bold text-gray-500 dark:text-gray-300">{copy.loading}</p>
        ) : isPasswordRecovery ? (
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase text-orange-500">{copy.recoveryKicker}</p>
              <h2 className="mt-2 text-2xl font-black text-gray-950 dark:text-white">{copy.recoveryTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.recoveryText}</p>
            </div>
            <form onSubmit={handlePasswordUpdate} className="grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-950 dark:text-white">{copy.newPassword}</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="********"
                  className="min-h-11 rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-950 dark:text-white">{copy.confirmPassword}</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="********"
                  className="min-h-11 rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? copy.submitting : copy.updatePassword}
              </button>
            </form>
          </div>
        ) : userEmail ? (
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase text-green-600 dark:text-green-300">{copy.connected}</p>
              <h2 className="mt-2 break-words text-2xl font-black text-gray-950 dark:text-white">{userEmail}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.connectedText}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href="/create-store"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
              >
                {copy.createStore}
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100"
              >
                {copy.dashboard}
              </Link>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-black text-gray-900 transition hover:border-red-200 hover:text-red-600 dark:border-white/10 dark:text-gray-100"
            >
              {copy.signOut}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {mode === "reset" ? (
              <div>
                <p className="text-xs font-black uppercase text-orange-500">{copy.resetKicker}</p>
                <h2 className="mt-2 text-2xl font-black text-gray-950 dark:text-white">{copy.resetTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.resetText}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 rounded-md bg-gray-100 p-1 dark:bg-white/10">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`min-h-10 rounded-md text-sm font-black transition ${
                  mode === "signin"
                    ? "bg-white text-gray-950 shadow-sm dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-orange-600 dark:text-gray-300"
                }`}
              >
                {copy.signIn}
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`min-h-10 rounded-md text-sm font-black transition ${
                  mode === "signup"
                    ? "bg-white text-gray-950 shadow-sm dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-orange-600 dark:text-gray-300"
                }`}
              >
                {copy.signUp}
              </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-950 dark:text-white">{copy.email}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="seller@example.com"
                  className="min-h-11 rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                />
              </label>
              {mode === "reset" ? null : (
                <label className="grid gap-2">
                  <span className="text-sm font-black text-gray-950 dark:text-white">{copy.password}</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="********"
                    className="min-h-11 rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
                  />
                </label>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? copy.submitting : mode === "reset" ? copy.sendResetLink : mode === "signup" ? copy.createAccount : copy.openSession}
              </button>
            </form>
            {mode === "reset" ? (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-200 px-4 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100"
              >
                {copy.backToSignIn}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="text-left text-sm font-black text-orange-600 transition hover:text-orange-700 dark:text-orange-300"
              >
                {copy.forgotPassword}
              </button>
            )}
            {mode === "reset" ? null : (
              <button
                type="button"
                onClick={signInWithGmail}
                disabled={isOAuthSubmitting}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100"
              >
                {isOAuthSubmitting ? copy.redirectingToGmail : copy.continueWithGmail}
              </button>
            )}
          </div>
        )}

        {message ? (
          <p className="mt-4 rounded-md border border-green-100 bg-green-50 p-3 text-sm font-bold text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-200">
            {message}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-md border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function getAuthCopy(language: string) {
  if (language === "fr") {
    return {
      kicker: "Compte vendeur",
      title: "Connectez-vous pour gerer votre boutique",
      description: "La version securisee lie chaque boutique a un compte vendeur Supabase Auth avant toute creation ou modification.",
      ruleStores: "Creation boutique : vendeur connecte obligatoire.",
      ruleProducts: "Import et suppression produits : proprietaire uniquement.",
      rulePublic: "Boutiques publiques : visibles par les visiteurs sans compte.",
      loading: "Verification de la session...",
      connected: "Session active",
      connectedText: "Vous pouvez maintenant creer votre boutique, importer des produits et ouvrir le dashboard vendeur.",
      createStore: "Creer une boutique",
      dashboard: "Dashboard",
      signOut: "Se deconnecter",
      signedOut: "Session fermee.",
      signIn: "Connexion",
      signUp: "Inscription",
      email: "Email",
      password: "Mot de passe",
      submitting: "Traitement...",
      createAccount: "Creer mon compte",
      openSession: "Me connecter",
      continueWithGmail: "Continuer avec Gmail",
      redirectingToGmail: "Redirection vers Gmail...",
      forgotPassword: "Mot de passe oublie ?",
      resetKicker: "Recuperation",
      resetTitle: "Recevoir un lien de reinitialisation",
      resetText: "Entrez l'email du proprietaire de la boutique. Si le compte existe, Supabase enverra un lien securise.",
      sendResetLink: "Envoyer le lien",
      resetEmailSent: "Si ce compte existe, un email de reinitialisation vient d'etre envoye.",
      backToSignIn: "Retour a la connexion",
      recoveryKicker: "Nouveau mot de passe",
      recoveryTitle: "Choisissez un nouveau mot de passe",
      recoveryText: "Votre lien est valide. Entrez un nouveau mot de passe pour recuperer l'acces a votre boutique.",
      newPassword: "Nouveau mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      updatePassword: "Mettre a jour le mot de passe",
      passwordUpdated: "Mot de passe mis a jour. Vous pouvez continuer sur votre dashboard vendeur.",
      passwordTooShort: "Le mot de passe doit contenir au moins 6 caracteres.",
      passwordsMismatch: "Les deux mots de passe ne correspondent pas.",
      signupSuccess: "Compte cree. Verifiez votre boite mail pour confirmer le compte.",
      signinSuccess: "Connexion reussie.",
      genericError: "Impossible de terminer l'authentification.",
    };
  }

  return {
    kicker: "Seller account",
    title: "Sign in to manage your store",
    description: "The secured version links every store to a Supabase Auth seller account before any creation or edit.",
    ruleStores: "Store creation requires a signed-in seller.",
    ruleProducts: "Product imports and removals are owner-only.",
    rulePublic: "Public stores remain visible to visitors without an account.",
    loading: "Checking session...",
    connected: "Active session",
    connectedText: "You can now create your store, import products, and open the seller dashboard.",
    createStore: "Create a store",
    dashboard: "Dashboard",
    signOut: "Sign out",
    signedOut: "Signed out.",
    signIn: "Sign in",
    signUp: "Sign up",
    email: "Email",
    password: "Password",
    submitting: "Processing...",
    createAccount: "Create account",
    openSession: "Sign in",
    continueWithGmail: "Continue with Gmail",
    redirectingToGmail: "Redirecting to Gmail...",
    forgotPassword: "Forgot password?",
    resetKicker: "Recovery",
    resetTitle: "Receive a reset link",
    resetText: "Enter the store owner's email. If the account exists, Supabase will send a secure link.",
    sendResetLink: "Send reset link",
    resetEmailSent: "If this account exists, a password reset email has been sent.",
    backToSignIn: "Back to sign in",
    recoveryKicker: "New password",
    recoveryTitle: "Choose a new password",
    recoveryText: "Your link is valid. Enter a new password to recover access to your store.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    updatePassword: "Update password",
    passwordUpdated: "Password updated. You can continue to your seller dashboard.",
    passwordTooShort: "Password must contain at least 6 characters.",
    passwordsMismatch: "The two passwords do not match.",
    signupSuccess: "Account created. Check your inbox to confirm the account.",
    signinSuccess: "Signed in.",
    genericError: "Unable to complete authentication.",
  };
}

function getAuthCallbackUrl(nextPath: string) {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

function hasRequestedNextPath() {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).has("next");
}

function getRequestedNextPath(fallbackPath: string) {
  if (typeof window === "undefined") {
    return fallbackPath;
  }

  const params = new URLSearchParams(window.location.search);
  return getSafeNextPath(params.get("next"), fallbackPath);
}

function getSafeNextPath(nextPath: string | null, fallbackPath: string) {
  if (
    !nextPath
    || !nextPath.startsWith("/")
    || nextPath.startsWith("//")
    || nextPath.includes("\\")
    || nextPath.startsWith("/auth")
  ) {
    return fallbackPath;
  }

  return nextPath;
}
