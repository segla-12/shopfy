"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createStoreSlug } from "@/lib/createdStores";
import { useLanguage } from "@/lib/language";
import { phoneCountries } from "@/lib/phoneCountries";
import { getContactDisplayName } from "@/lib/resellerStore";
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
  kind: "" | "personal" | "reseller";
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
  resellerFirstName: string;
  resellerLastName: string;
  resellerCountry: string;
  resellerCity: string;
  resellerWhatsappPhone: string;
  futureOwnerFirstName: string;
  futureOwnerLastName: string;
  futureOwnerCountry: string;
  futureOwnerCity: string;
  futureOwnerWhatsappPhone: string;
};

const initialValues: WizardValues = {
  kind: "",
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
  resellerFirstName: "",
  resellerLastName: "",
  resellerCountry: "",
  resellerCity: "",
  resellerWhatsappPhone: "",
  futureOwnerFirstName: "",
  futureOwnerLastName: "",
  futureOwnerCountry: "",
  futureOwnerCity: "",
  futureOwnerWhatsappPhone: "",
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
  const slug = useMemo(() => createStoreSlug(values.name), [values.name]);
  const countryOptions = useMemo(
    () => phoneCountries.map((country) => country.name[language === "fr" ? "fr" : "en"]),
    [language],
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      supabase.auth.getSession().then(({ data }) => {
        setIsAuthenticated(Boolean(data.session));
        setIsCheckingAuth(false);
      });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (step === 1) {
      if (values.kind === "personal" && !isValidInternationalWhatsappPhoneInput(values.whatsappPhone)) {
        setErrorMessage(getInternationalWhatsappPhoneError());
        return;
      }

      if (values.kind === "reseller" && !isValidInternationalWhatsappPhoneInput(values.resellerWhatsappPhone)) {
        setErrorMessage(getInternationalWhatsappPhoneError());
        return;
      }
    }

    if (values.kind === "reseller" && values.futureOwnerWhatsappPhone && !isValidInternationalWhatsappPhoneInput(values.futureOwnerWhatsappPhone)) {
      setErrorMessage(getInternationalWhatsappPhoneError());
      return;
    }

    if (step < 3) {
      setStep((currentStep) => currentStep + 1);
      return;
    }

    setIsSaving(true);

    try {
      const reseller = {
        firstName: values.resellerFirstName,
        lastName: values.resellerLastName,
        country: values.resellerCountry,
        city: values.resellerCity,
        whatsappPhone: normalizeWhatsappPhone(values.resellerWhatsappPhone),
      };
      const futureOwner = {
        firstName: values.futureOwnerFirstName,
        lastName: values.futureOwnerLastName,
        country: values.futureOwnerCountry,
        city: values.futureOwnerCity,
        whatsappPhone: normalizeWhatsappPhone(values.futureOwnerWhatsappPhone),
      };
      const futureOwnerName = getContactDisplayName(futureOwner);
      const resellerName = getContactDisplayName(reseller);
      const store = await createSupabaseStore(values.kind === "reseller"
        ? {
            kind: "reseller",
            name: values.name,
            category: values.category,
            ownerName: futureOwnerName || resellerName,
            city: futureOwner.city || reseller.city,
            country: futureOwner.country || reseller.country,
            currency: values.currency,
            whatsappPhone: futureOwner.whatsappPhone || reseller.whatsappPhone,
            tagline: values.tagline,
            description: values.description,
            logoUrl: values.logoUrl,
            bannerUrl: values.bannerUrl,
            reseller,
            futureOwner,
          }
        : {
            ...values,
            kind: "personal",
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
            {createdStore.kind === "reseller" ? copy.resellerSuccessText : copy.successText}{" "}
            {createdStore.kind === "reseller" ? null : <span className="font-black text-gray-950 dark:text-white">{storeUrl}</span>}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {createdStore.kind === "reseller" ? null : <Link
              href={`/store/${createdStore.slug}`}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
            >
              {copy.openStore}
            </Link>}
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

  if (values.kind === "personal" && !isAuthenticated) {
    return (
      <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10">
        <div className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm dark:border-orange-400/20 dark:bg-gray-900">
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.authKicker}</p>
          <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">{copy.authTitle}</h1>
          <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">{copy.authText}</p>
          <Link
            href="/auth?next=/dashboard"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {copy.authAction}
          </Link>
        </div>
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

      {!values.kind ? (
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => updateValue("kind", "personal")}
            className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-orange-200 dark:border-white/10 dark:bg-gray-900"
          >
            <span className="text-lg font-black text-gray-950 dark:text-white">{copy.personalStore}</span>
            <span className="mt-2 block text-sm font-semibold leading-6 text-gray-500 dark:text-gray-300">{copy.personalStoreText}</span>
          </button>
          <button
            type="button"
            onClick={() => updateValue("kind", "reseller")}
            className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-orange-200 dark:border-white/10 dark:bg-gray-900"
          >
            <span className="text-lg font-black text-gray-950 dark:text-white">{copy.resellerStore}</span>
            <span className="mt-2 block text-sm font-semibold leading-6 text-gray-500 dark:text-gray-300">{copy.resellerStoreText}</span>
          </button>
        </div>
      ) : null}

      {values.kind ? <div className="grid gap-3 md:grid-cols-3">
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
      </div> : null}

      {values.kind ? <form onSubmit={handleSubmit} className="grid gap-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-900 sm:p-6">
        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {values.kind === "reseller" ? (
              <>
                <TextField label={copy.resellerLastName} value={values.resellerLastName} onChange={(value) => updateValue("resellerLastName", value)} required />
                <TextField label={copy.resellerFirstName} value={values.resellerFirstName} onChange={(value) => updateValue("resellerFirstName", value)} required />
                <SelectField label={copy.resellerCountry} value={values.resellerCountry} onChange={(value) => updateValue("resellerCountry", value)} options={countryOptions} required placeholder={copy.selectCountry} />
                <TextField label={copy.resellerCity} value={values.resellerCity} onChange={(value) => updateValue("resellerCity", value)} required />
                <TextField label={copy.resellerWhatsappPhone} value={values.resellerWhatsappPhone} onChange={(value) => updateValue("resellerWhatsappPhone", value)} required placeholder={copy.whatsappPlaceholder} />
              </>
            ) : (
              <>
                <TextField label={copy.ownerName} value={values.ownerName} onChange={(value) => updateValue("ownerName", value)} required />
                <TextField label={copy.city} value={values.city} onChange={(value) => updateValue("city", value)} required />
                <SelectField label={copy.country} value={values.country} onChange={(value) => updateValue("country", value)} options={countryOptions} required placeholder={copy.selectCountry} />
                <TextField label={copy.whatsappPhone} value={values.whatsappPhone} onChange={(value) => updateValue("whatsappPhone", value)} required placeholder={copy.whatsappPlaceholder} />
              </>
            )}
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
            {values.kind === "reseller" ? (
              <div className="grid gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5 md:grid-cols-2">
                <p className="md:col-span-2 text-sm font-black text-gray-950 dark:text-white">{copy.futureOwnerTitle}</p>
                <TextField label={copy.futureOwnerLastName} value={values.futureOwnerLastName} onChange={(value) => updateValue("futureOwnerLastName", value)} />
                <TextField label={copy.futureOwnerFirstName} value={values.futureOwnerFirstName} onChange={(value) => updateValue("futureOwnerFirstName", value)} />
                <SelectField label={copy.futureOwnerCountry} value={values.futureOwnerCountry} onChange={(value) => updateValue("futureOwnerCountry", value)} options={countryOptions} placeholder={copy.notProvided} />
                <TextField label={copy.futureOwnerCity} value={values.futureOwnerCity} onChange={(value) => updateValue("futureOwnerCity", value)} />
                <TextField label={copy.futureOwnerWhatsappPhone} value={values.futureOwnerWhatsappPhone} onChange={(value) => updateValue("futureOwnerWhatsappPhone", value)} placeholder={copy.whatsappPlaceholder} />
              </div>
            ) : null}
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
                <p>{copy.location}: <span className="text-gray-950 dark:text-white">{values.kind === "reseller" ? `${values.resellerCity}, ${values.resellerCountry}` : `${values.city}, ${values.country}`}</span></p>
                <p>{copy.currency}: <span className="text-gray-950 dark:text-white">{values.currency}</span></p>
                <p>{copy.whatsappPhone}: <span className="text-gray-950 dark:text-white">{values.kind === "reseller" ? values.resellerWhatsappPhone : values.whatsappPhone}</span></p>
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
      </form> : null}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-gray-950 dark:text-white">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        className="min-h-11 rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-white/10 dark:bg-gray-950 dark:text-white"
      />
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
      personalStore: "Boutique personnelle",
      personalStoreText: "Creez une boutique rattachee a votre compte vendeur.",
      resellerStore: "Boutique revendeur",
      resellerStoreText: "Preparez une boutique pour un futur proprietaire, sans creer de compte maintenant.",
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
      whatsappPlaceholder: "+ indicatif pays et numero",
      selectCountry: "Selectionner un pays",
      notProvided: "Non renseigne",
      resellerLastName: "Nom du revendeur",
      resellerFirstName: "Prenoms du revendeur",
      resellerCountry: "Pays du revendeur",
      resellerCity: "Ville / lieu de vie",
      resellerWhatsappPhone: "WhatsApp du revendeur",
      futureOwnerTitle: "Futur proprietaire (optionnel)",
      futureOwnerLastName: "Nom du proprietaire",
      futureOwnerFirstName: "Prenoms du proprietaire",
      futureOwnerCountry: "Pays du proprietaire",
      futureOwnerCity: "Ville / localisation",
      futureOwnerWhatsappPhone: "WhatsApp du proprietaire",
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
      resellerSuccessText: "La boutique revendeur est enregistree en brouillon non publie dans l'Admin Shopfy.",
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
      personalStore: "Personal store",
      personalStoreText: "Create a store attached to your seller account.",
      resellerStore: "Reseller store",
      resellerStoreText: "Prepare a store for a future owner without creating an account now.",
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
    whatsappPlaceholder: "+ country code and number",
    selectCountry: "Select a country",
    notProvided: "Not provided",
    resellerLastName: "Reseller last name",
    resellerFirstName: "Reseller first names",
    resellerCountry: "Reseller country",
    resellerCity: "City / place of life",
    resellerWhatsappPhone: "Reseller WhatsApp",
    futureOwnerTitle: "Future owner (optional)",
    futureOwnerLastName: "Owner last name",
    futureOwnerFirstName: "Owner first names",
    futureOwnerCountry: "Owner country",
    futureOwnerCity: "City / location",
    futureOwnerWhatsappPhone: "Owner WhatsApp",
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
    resellerSuccessText: "The reseller store is saved as an unpublished draft in Shopfy Admin.",
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
