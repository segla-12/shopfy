"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language";
import { buildInternationalPhone, getPhoneCountry, phoneCountries } from "@/lib/phoneCountries";

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
  const [countryCode, setCountryCode] = useState("");
  const [nationalNumber, setNationalNumber] = useState("");
  const selectedCountry = useMemo(() => getPhoneCountry(countryCode), [countryCode]);
  const internationalPhone = buildInternationalPhone(selectedCountry, nationalNumber);
  const isComplete = Boolean(internationalPhone);
  const helperText = selectedCountry
    ? t("phone.expectedDigits", {
        count: selectedCountry.nationalLength,
        country: selectedCountry.name[language],
      })
    : t("phone.chooseCountryHelper");

  function updateCountry(event: ChangeEvent<HTMLSelectElement>) {
    const nextCountryCode = event.target.value;
    const nextCountry = getPhoneCountry(nextCountryCode);
    const trimmedNumber = nextCountry ? nationalNumber.slice(0, nextCountry.nationalLength) : nationalNumber;
    const nextPhone = buildInternationalPhone(nextCountry, trimmedNumber);

    setCountryCode(nextCountryCode);
    setNationalNumber(trimmedNumber);
    onChange?.(nextPhone);
  }

  function updateNationalNumber(event: ChangeEvent<HTMLInputElement>) {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    const nextNumber = selectedCountry ? digitsOnly.slice(0, selectedCountry.nationalLength) : digitsOnly;
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
          <select
            required
            value={countryCode}
            onChange={updateCountry}
            className="min-h-12 w-full max-w-full appearance-none rounded-2xl border border-gray-200 bg-white py-3 pl-4 pr-10 font-bold text-gray-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          >
            <option value="">{t("phone.countryPlaceholder")}</option>
            {phoneCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name[language]} {country.dialCode}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            ▾
          </span>
        </label>

        <label className="grid min-w-0">
          <span className="sr-only">{t("phone.numberSr")}</span>
          <div className="flex min-h-12 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100">
            <span className="flex min-w-[5.75rem] items-center justify-center gap-2 border-r border-gray-100 bg-gray-50 px-3 text-sm font-black text-gray-950">
              <span aria-hidden="true">{selectedCountry?.flag || "🌍"}</span>
              <span>{selectedCountry?.dialCode || "+..."}</span>
            </span>
            <input
              required
              type="tel"
              inputMode="numeric"
              pattern={selectedCountry ? `\\d{${selectedCountry.nationalLength}}` : "\\d+"}
              maxLength={selectedCountry?.nationalLength}
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

      <input name={name} type="hidden" required value={value ?? internationalPhone} readOnly />
      <input name={countryName} type="hidden" value={selectedCountry?.code || ""} readOnly />

      <p className={`text-xs font-bold ${nationalNumber.length > 0 && !isComplete ? "text-red-600" : "text-gray-500"}`}>
        {nationalNumber.length > 0 && !isComplete
          ? t("phone.incomplete", {
              current: nationalNumber.length,
              expected: selectedCountry?.nationalLength || 0,
            })
          : helperText}
      </p>
    </div>
  );
}
