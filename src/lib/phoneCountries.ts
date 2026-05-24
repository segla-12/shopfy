export type PhoneCountry = {
  code: string;
  name: {
    fr: string;
    en: string;
  };
  flag: string;
  dialCode: string;
  nationalLength: number;
};

export const phoneCountries: PhoneCountry[] = [
  { code: "BJ", name: { fr: "Bénin", en: "Benin" }, flag: "🇧🇯", dialCode: "+229", nationalLength: 8 },
  { code: "TG", name: { fr: "Togo", en: "Togo" }, flag: "🇹🇬", dialCode: "+228", nationalLength: 8 },
  { code: "CI", name: { fr: "Côte d'Ivoire", en: "Ivory Coast" }, flag: "🇨🇮", dialCode: "+225", nationalLength: 10 },
  { code: "SN", name: { fr: "Sénégal", en: "Senegal" }, flag: "🇸🇳", dialCode: "+221", nationalLength: 9 },
  { code: "BF", name: { fr: "Burkina Faso", en: "Burkina Faso" }, flag: "🇧🇫", dialCode: "+226", nationalLength: 8 },
  { code: "ML", name: { fr: "Mali", en: "Mali" }, flag: "🇲🇱", dialCode: "+223", nationalLength: 8 },
  { code: "NE", name: { fr: "Niger", en: "Niger" }, flag: "🇳🇪", dialCode: "+227", nationalLength: 8 },
  { code: "GH", name: { fr: "Ghana", en: "Ghana" }, flag: "🇬🇭", dialCode: "+233", nationalLength: 9 },
  { code: "NG", name: { fr: "Nigeria", en: "Nigeria" }, flag: "🇳🇬", dialCode: "+234", nationalLength: 10 },
];

export function getPhoneCountry(code: string) {
  return phoneCountries.find((country) => country.code === code) || null;
}

export function getPhoneCountryByDialCode(phone: string) {
  const normalizedPhone = phone.replace(/\s/g, "");

  return phoneCountries.find((country) => normalizedPhone.startsWith(country.dialCode)) || null;
}

export function buildInternationalPhone(country: PhoneCountry | null, nationalNumber: string) {
  if (!country || nationalNumber.length !== country.nationalLength) {
    return "";
  }

  return `${country.dialCode}${nationalNumber}`;
}
