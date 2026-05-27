"use client";

import { ChangeEvent, useId, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language";
import {
  buildInternationalPhone,
  getNationalNumberBounds,
  getPhoneCountry,
  PhoneCountry,
  phoneCountries,
} from "@/lib/phoneCountries";

type PhoneInputProps = {
  name?: string;
  countryName?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
};

export function PhoneInput({
  name = "sellerPhone",
  countryName = "sellerCountry",
  label,
  value,
  onChange,
  className = "",
}: PhoneInputProps) {
  const { language, t } = useLanguage();
  const countryListId = useId();
  const [countryCode, setCountryCode] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [nationalNumber, setNationalNumber] = useState("");
  const selectedCountry = useMemo(() => getPhoneCountry(countryCode), [countryCode]);
  const bounds = selectedCountry ? getNationalNumberBounds(selectedCountry) : null;
  const internationalPhone = buildInternationalPhone(selectedCountry, nationalNumber);
  const isComplete = Boolean(internationalPhone);
  const countrySearchValue = selectedCountry ? formatCountryOption(selectedCountry, language) : countryQuery;
  const filteredCountries = useMemo(() => {
    const normalizedQuery = normalizeCountrySearch(countryQuery);

    if (!normalizedQuery) {
      return phoneCountries;
    }

    return phoneCountries.filter((country) => {
      const searchableValue = normalizeCountrySearch([
        country.name.fr,
        country.name.en,
        country.dialCode,
        country.code,
      ].join(" "));

      return searchableValue.includes(normalizedQuery);
    });
  }, [countryQuery]);
  const helperText = selectedCountry && bounds
    ? bounds.min === bounds.max
      ? t("phone.expectedDigits", {
          count: bounds.max,
          country: selectedCountry.name[language],
        })
      : t("phone.expectedDigitsRange", {
          min: bounds.min,
          max: bounds.max,
          country: selectedCountry.name[language],
        })
    : t("phone.chooseCountryHelper");

  function selectCountry(country: PhoneCountry) {
    const nextBounds = getNationalNumberBounds(country);
    const trimmedNumber = nationalNumber.slice(0, nextBounds.max);
    const nextPhone = buildInternationalPhone(country, trimmedNumber);

    setCountryCode(country.code);
    setCountryQuery("");
    setNationalNumber(trimmedNumber);
    setIsCountryOpen(false);
    onChange?.(nextPhone);
  }

  function updateCountryQuery(event: ChangeEvent<HTMLInputElement>) {
    const nextQuery = event.target.value;

    setCountryQuery(nextQuery);
    setIsCountryOpen(true);

    if (selectedCountry) {
      setCountryCode("");
      setNationalNumber("");
      onChange?.("");
    }
  }

  function updateNationalNumber(event: ChangeEvent<HTMLInputElement>) {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    const nextNumber = bounds ? digitsOnly.slice(0, bounds.max) : digitsOnly;
    const nextPhone = buildInternationalPhone(selectedCountry, nextNumber);

    setNationalNumber(nextNumber);
    onChange?.(nextPhone);
  }

  return (
    <div className={`grid min-w-0 gap-2 ${className}`}>
      <span className="text-sm font-black text-gray-900">{label || t("phone.defaultLabel")}</span>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <label className="relative grid min-w-0">
          <span className="sr-only">{t("phone.countrySr")}</span>
          <input
            required
            type="search"
            suppressHydrationWarning
            role="combobox"
            aria-expanded={isCountryOpen}
            aria-controls={countryListId}
            autoComplete="off"
            value={countrySearchValue}
            onChange={updateCountryQuery}
            onFocus={() => setIsCountryOpen(true)}
            onBlur={() => window.setTimeout(() => setIsCountryOpen(false), 120)}
            onInvalid={(event) => {
              if (!selectedCountry) {
                event.currentTarget.setCustomValidity(t("phone.chooseCountryHelper"));
              }
            }}
            onInput={(event) => event.currentTarget.setCustomValidity("")}
            pattern={selectedCountry ? ".*" : "\\b\\B"}
            placeholder={t("phone.countryPlaceholder")}
            className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 bg-white py-3 pl-4 pr-10 font-bold text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          />
          <span className="pointer-events-none absolute right-4 top-6 -translate-y-1/2 text-sm text-gray-400">
            ▾
          </span>

          {isCountryOpen ? (
            <div
              id={countryListId}
              className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl shadow-gray-950/10"
            >
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectCountry(country);
                    }}
                    className="grid min-h-11 w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-3 text-left text-sm transition hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
                  >
                    <span className="text-lg" aria-hidden="true">{country.flag}</span>
                    <span className="min-w-0 truncate font-bold text-gray-950">{country.name[language]}</span>
                    <span className="text-xs font-black text-gray-500">{country.dialCode}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-4 text-sm font-bold text-gray-500">{t("marketplace.emptyTitle")}</p>
              )}
            </div>
          ) : null}
        </label>

        <label className="grid min-w-0">
          <span className="sr-only">{t("phone.numberSr")}</span>
          <div className="flex min-h-12 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100">
            <span className="flex min-w-[6rem] items-center justify-center gap-2 border-r border-gray-100 bg-gray-50 px-3 text-sm font-black text-gray-950">
              <span aria-hidden="true">{selectedCountry?.flag || "🌍"}</span>
              <span>{selectedCountry?.dialCode || "+..."}</span>
            </span>
            <input
              required
              type="tel"
              suppressHydrationWarning
              inputMode="numeric"
              pattern={bounds ? `\\d{${bounds.min},${bounds.max}}` : "\\d+"}
              maxLength={bounds?.max}
              value={nationalNumber}
              onChange={updateNationalNumber}
              disabled={!selectedCountry}
              placeholder={selectedCountry ? t("phone.localPlaceholder") : t("phone.chooseCountryPlaceholder")}
              aria-invalid={nationalNumber.length > 0 && !isComplete}
              className="min-h-12 min-w-0 flex-1 border-0 px-4 outline-none disabled:bg-white disabled:text-gray-400"
            />
          </div>
        </label>
      </div>

      <input name={name} type="hidden" required value={value ?? internationalPhone} readOnly suppressHydrationWarning />
      <input name={countryName} type="hidden" value={selectedCountry?.code || ""} readOnly suppressHydrationWarning />

      <p className={`text-xs font-bold ${nationalNumber.length > 0 && !isComplete ? "text-red-600" : "text-gray-500"}`}>
        {nationalNumber.length > 0 && !isComplete && bounds
          ? bounds.min === bounds.max
            ? t("phone.incomplete", {
                current: nationalNumber.length,
                expected: bounds.max,
              })
            : t("phone.incompleteRange", {
                current: nationalNumber.length,
                min: bounds.min,
                max: bounds.max,
              })
          : helperText}
      </p>
    </div>
  );
}

function formatCountryOption(country: PhoneCountry, language: "fr" | "en") {
  return `${country.flag} ${country.name[language]} (${country.dialCode})`;
}

function normalizeCountrySearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
