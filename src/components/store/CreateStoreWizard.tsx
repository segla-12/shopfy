"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createStoreSlug } from "@/lib/createdStores";
import { useLanguage } from "@/lib/language";
import { phoneCountries, type PhoneCountry } from "@/lib/phoneCountries";
import { supabase } from "@/lib/supabase";
import { getStorePublicUrl, getStoreQrUrl } from "@/lib/storeLinks";
import {
  getInternationalWhatsappPhoneError,
  isValidInternationalWhatsappPhoneInput,
  normalizeWhatsappPhone,
} from "@/lib/whatsapp";
import { createSupabaseStore } from "@/services/storeService";
import type { ShopfyStore } from "@/types/storefront";
import { StoreQrCode } from "./StoreQrCode";

type WizardValues = {
  name: string;
  category: string;
  ownerName: string;
  city: string;
  country: string;
  currency: string;
  whatsappPhone: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
};

const initialValues: WizardValues = {
  name: "",
  category: "General",
  ownerName: "",
  city: "",
  country: "",
  currency: "XOF",
  whatsappPhone: "",
  tagline: "",
  description: "",
  logoUrl: "",
  bannerUrl: "",
};

export function CreateStoreWizard() {
  const { language } = useLanguage();
  const copy = getCreateStoreCopy(language);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<WizardValues>(initialValues);
  const [createdStore, setCreatedStore] = useState<ShopfyStore | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);
  const slug = useMemo(() => createStoreSlug(values.name), [values.name]);
  const selectedCountry = useMemo(
    () => getSelectedPhoneCountry(values.country),
    [values.country],
  );
  const countryOptions = useMemo(
    () => phoneCountries.map((country) => country.name[language === "fr" ? "fr" : "en"]),
    [language],
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      supabase.auth.getSession().then(({ data }) => {
        setIsAuthenticated(Boolean(data.session));
        setAuthEmail(data.session?.user.email || "");
        setEmailConfirmation(data.session?.user.email || "");
        setIsCheckingAuth(false);
      });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setAuthEmail(session?.user.email || "");
      setEmailConfirmation(session?.user.email || "");
      setIsCheckingAuth(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      data.subscription.unsubscribe();
    };
  }, []);

  function updateValue(field: keyof WizardValues, value: string) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
  }

  function updateCountry(countryName: string) {
    setValues((currentValues) => {
      const previousCountry = getSelectedPhoneCountry(currentValues.country);
      const nextCountry = getSelectedPhoneCountry(countryName);
      const currentPhone = currentValues.whatsappPhone.trim();
      const nationalPhone = previousCountry && currentPhone.startsWith(previousCountry.dialCode)
        ? currentPhone.slice(previousCountry.dialCode.length).replace(/\D/g, "")
        : currentPhone.replace(/\D/g, "");

      return {
        ...currentValues,
        country: countryName,
        whatsappPhone: nextCountry ? `${nextCountry.dialCode}${nationalPhone}` : currentValues.whatsappPhone,
      };
    });
  }

  function updateNationalPhone(nationalPhone: string) {
    const digits = nationalPhone.replace(/\D/g, "");
    updateValue("whatsappPhone", selectedCountry ? `${selectedCountry.dialCode}${digits}` : digits);
  }

  function confirmEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (emailConfirmation.trim().toLowerCase() !== authEmail.trim().toLowerCase()) {
      setErrorMessage(copy.emailMismatch);
      return;
    }

    setIsEmailConfirmed(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (step === 1 && !isValidInternationalWhatsappPhoneInput(values.whatsappPhone)) {
      setErrorMessage(getInternationalWhatsappPhoneError());
      return;
    }

    if (step < 3) {
      setStep((currentStep) => currentStep + 1);
      return;
    }

    setIsSaving(true);

    try {
      const store = await createSupabaseStore({
        ...values,
        whatsappPhone: normalizeWhatsappPhone(values.whatsappPhone),
      });
      setCreatedStore(store);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  if (createdStore) {
    const storeUrl = getStorePublicUrl(createdStore.slug);

    return (
      <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10">
        <div className="rounded-lg border border-green-100 bg-white p-5 shadow-sm dark:border-green-400/20 dark:bg-gray-900">
          <p className="text-sm font-black uppercase tracking-wide text-green-600 dark:text-green-300">{copy.successKicker}</p>
          <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">{copy.successTitle}</h1>
          <p className="mt-3 break-words text-base leading-7 text-gray-600 dark:text-gray-300">
            {copy.successText} <span className="font-black text-gray-950 dark:text-white">{storeUrl}</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/store/${createdStore.slug}`}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
            >
              {copy.openStore}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100"
            >
              {copy.dashboard}
            </Link>
          </div>
        </div>
        <StoreQrCode
          url={getStoreQrUrl(createdStore.slug)}
          title={copy.qrTitle}
          downloadLabel={copy.downloadQr}
          fileName={`shopfy-${createdStore.slug}-qr.png`}
        />
      </section>
    );
  }

  if (isCheckingAuth) {
    return (
      <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-300">{copy.authChecking}</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10">
        <div className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm dark:border-orange-400/20 dark:bg-gray-900">
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.authKicker}</p>
          <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">{copy.authTitle}</h1>
          <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">{copy.authText}</p>
          <Link
            href="/auth?next=/create-store"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {copy.authAction}
          </Link>
        </div>
      </section>
    );
  }

  if (!isEmailConfirmed) {
    return (
      <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10">
        <form onSubmit={confirmEmail} className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.emailConfirmKicker}</p>
            <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">{copy.emailConfirmTitle}</h1>
            <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">{copy.emailConfirmText}</p>
          </div>
          <TextField
            label={copy.email}
            value={emailConfirmation}
            onChange={setEmailConfirmation}
            required
            type="email"
            autoComplete="email"
          />
          {errorMessage ? (
            <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              {errorMessage}
            </p>
          ) : null}
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {copy.emailConfirmAction}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10">
      <div className="grid gap-3">
        <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.kicker}</p>
        <h1 className="text-3xl font-black tracking-tight text-gray-950 md:text-5xl dark:text-white">{copy.title}</h1>
        <p className="max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">{copy.description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[copy.stepIdentity, copy.stepBrand, copy.stepLaunch].map((label, index) => {
          const itemStep = index + 1;
          const isActive = step === itemStep;
          const isDone = step > itemStep;

          return (
            <div
              key={label}
              className={`rounded-lg border p-4 ${
                isActive || isDone
                  ? "border-orange-200 bg-orange-50 dark:border-orange-400/20 dark:bg-orange-400/10"
                  : "border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900"
              }`}
            >
              <p className="text-xs font-black uppercase text-gray-500 dark:text-gray-400">{copy.step} {itemStep}</p>
              <p className="mt-1 font-black text-gray-950 dark:text-white">{label}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:p-6">
        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label={copy.ownerName} value={values.ownerName} onChange={(value) => updateValue("ownerName", value)} required />
            <TextField label={copy.city} value={values.city} onChange={(value) => updateValue("city", value)} required />
            <SelectField label={copy.country} value={values.country} onChange={updateCountry} options={countryOptions} required placeholder={copy.selectCountry} />
            <PhoneField label={copy.whatsappPhone} dialCode={selectedCountry?.dialCode || ""} value={getNationalPhone(values.whatsappPhone, selectedCountry)} onChange={updateNationalPhone} required placeholder={copy.whatsappPlaceholder} />
            <TextField label={copy.storeName} value={values.name} onChange={(value) => updateValue("name", value)} required />
            <SelectField label={copy.category} value={values.category} onChange={(value) => updateValue("category", value)} options={["General", "Fashion", "Beauty", "Shoes", "Electronics", "Home", "Food", "Other"]} />
            <SelectField label={copy.currency} value={values.currency} onChange={(value) => updateValue("currency", value)} options={["XOF", "USD", "EUR", "GBP", "CAD"]} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4">
            <TextField label={copy.tagline} value={values.tagline} onChange={(value) => updateValue("tagline", value)} />
            <label className="grid gap-2">
              <span className="text-sm font-black text-gray-950 dark:text-white">{copy.descriptionLabel}</span>
              <textarea
                value={values.description}
                onChange={(event) => updateValue("description", event.target.value)}
                rows={4}
                placeholder={copy.descriptionPlaceholder}
                className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label={copy.logoUrl} value={values.logoUrl} onChange={(value) => updateValue("logoUrl", value)} placeholder="https://..." />
              <TextField label={copy.bannerUrl} value={values.bannerUrl} onChange={(value) => updateValue("bannerUrl", value)} placeholder="https://..." />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-black uppercase text-orange-500">{copy.preview}</p>
              <h2 className="mt-2 break-words text-2xl font-black text-gray-950 dark:text-white">{values.name || copy.untitledStore}</h2>
              <p className="mt-2 break-words text-sm leading-6 text-gray-600 dark:text-gray-300">{values.tagline || copy.defaultTagline}</p>
              <div className="mt-4 grid gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
                <p>{copy.publicUrl}: <span className="text-gray-950 dark:text-white">{getStorePublicUrl(slug)}</span></p>
                <p>{copy.location}: <span className="text-gray-950 dark:text-white">{values.city}, {values.country}</span></p>
                <p>{copy.currency}: <span className="text-gray-950 dark:text-white">{values.currency}</span></p>
                <p>{copy.whatsappPhone}: <span className="text-gray-950 dark:text-white">{values.whatsappPhone}</span></p>
              </div>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 dark:border-white/10 sm:flex-row sm:justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((currentStep) => Math.max(1, currentStep - 1))}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-100"
          >
            {copy.back}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {isSaving ? copy.saving : step === 3 ? copy.create : copy.next}
          </button>
        </div>
      </form>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  maxLength,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-gray-950 dark:text-white">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="min-h-11 rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
      />
    </label>
  );
}

function PhoneField({
  label,
  dialCode,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  dialCode: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-gray-950 dark:text-white">{label}</span>
      <div className="flex min-h-11 overflow-hidden rounded-md border border-gray-200 bg-white text-sm text-gray-950 focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white">
        <span className="inline-flex items-center border-r border-gray-200 px-4 font-black dark:border-white/10">{dialCode || "+"}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-4 outline-none"
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-gray-950 dark:text-white">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="min-h-11 rounded-md border border-gray-200 bg-white px-4 text-sm font-bold text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function getCreateStoreCopy(language: string) {
  if (language === "fr") {
    return {
      kicker: "Creation boutique",
      title: "Creez votre boutique Shopfy",
      description: "Suivez les etapes, obtenez votre lien public, puis ajoutez vos produits ou importez ceux des fournisseurs.",
      step: "Etape",
      stepIdentity: "Identite",
      stepBrand: "Design",
      stepLaunch: "Validation",
      storeName: "Nom de la boutique",
      ownerName: "Nom du vendeur",
      category: "Categorie",
      currency: "Devise",
      city: "Ville",
      country: "Pays",
      whatsappPhone: "WhatsApp de commande",
      whatsappPlaceholder: "Numero national",
      email: "Email",
      emailConfirmKicker: "Email confirme",
      emailConfirmTitle: "Confirmez votre email",
      emailConfirmText: "Utilisez l'email de votre session ou celui propose par votre navigateur pour continuer.",
      emailConfirmAction: "Continuer",
      emailMismatch: "Confirmez l'email connecte a votre session.",
      selectCountry: "Selectionner un pays",
      tagline: "Phrase courte",
      descriptionLabel: "Description",
      descriptionPlaceholder: "Expliquez ce que votre boutique vend...",
      logoUrl: "Logo URL",
      bannerUrl: "Banniere URL",
      preview: "Apercu",
      untitledStore: "Ma boutique Shopfy",
      defaultTagline: "Boutique vendeur neutre creee sur Shopfy.",
      publicUrl: "Lien public",
      location: "Localisation",
      back: "Retour",
      next: "Continuer",
      create: "Créer la boutique",
      successKicker: "Boutique creee",
      successTitle: "Votre boutique est prete",
      successText: "Votre lien public est",
      openStore: "Ouvrir ma boutique",
      dashboard: "Aller au dashboard",
      qrTitle: "Code QR de la boutique",
      downloadQr: "Telecharger le code QR",
      saving: "Creation...",
      saveError: "Impossible de creer la boutique dans Supabase.",
      authChecking: "Verification du compte vendeur...",
      authKicker: "Compte requis",
      authTitle: "Connectez-vous avant de creer une boutique",
      authText: "La version securisee attache chaque boutique a son proprietaire. Creez ou ouvrez votre compte vendeur pour continuer.",
      authAction: "Ouvrir mon compte vendeur",
    };
  }

  return {
    kicker: "Store creation",
      title: "Create your Shopfy store",
      description: "Follow the steps, get your public link, then add your products or import supplier products.",
      step: "Step",
    stepIdentity: "Identity",
    stepBrand: "Brand",
    stepLaunch: "Review",
    storeName: "Store name",
    ownerName: "Seller name",
    category: "Category",
    currency: "Currency",
    city: "City",
    country: "Country",
    whatsappPhone: "Order WhatsApp",
    whatsappPlaceholder: "National number",
    email: "Email",
    emailConfirmKicker: "Email confirmed",
    emailConfirmTitle: "Confirm your email",
    emailConfirmText: "Use your session email or the email suggested by your browser to continue.",
    emailConfirmAction: "Continue",
    emailMismatch: "Confirm the email connected to your session.",
    selectCountry: "Select a country",
    tagline: "Short tagline",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Explain what your store sells...",
    logoUrl: "Logo URL",
    bannerUrl: "Banner URL",
    preview: "Preview",
    untitledStore: "My Shopfy store",
    defaultTagline: "Neutral seller store created on Shopfy.",
    publicUrl: "Public link",
    location: "Location",
    back: "Back",
    next: "Continue",
    create: "Create store",
    successKicker: "Store created",
    successTitle: "Your store is ready",
    successText: "Your public link is",
    openStore: "Open my store",
    dashboard: "Go to dashboard",
    qrTitle: "Store QR code",
    downloadQr: "Download QR code",
    saving: "Creating...",
    saveError: "Unable to create the store in Supabase.",
    authChecking: "Checking seller account...",
    authKicker: "Account required",
    authTitle: "Sign in before creating a store",
    authText: "The secured version attaches each store to its owner. Create or open your seller account to continue.",
    authAction: "Open my seller account",
  };
}

function getSelectedPhoneCountry(countryName: string) {
  return phoneCountries.find((country) => (
    country.name.fr === countryName || country.name.en === countryName
  ));
}

function getNationalPhone(phone: string, country?: PhoneCountry) {
  const normalizedPhone = phone.trim();

  if (!country) {
    return normalizedPhone.replace(/\D/g, "");
  }

  return normalizedPhone.startsWith(country.dialCode)
    ? normalizedPhone.slice(country.dialCode.length).replace(/\D/g, "")
    : normalizedPhone.replace(/\D/g, "");
}
