import { getNationalNumberBounds, phoneCountries } from "@/lib/phoneCountries";

const DEFAULT_WHATSAPP_MESSAGE = "Je suis interesse par votre produit";
const INTERNATIONAL_PHONE_ERROR = "Le numero WhatsApp doit commencer par un indicatif international valide, par exemple +229, +225 ou +234.";

export function normalizeWhatsappPhone(phone?: string | null): string {
  if (!phone) {
    return "";
  }

  return String(phone).replace(/\D/g, "");
}

export function isValidWhatsappPhone(phone?: string | null): boolean {
  const normalized = normalizeWhatsappPhone(phone);

  return Boolean(getWhatsappPhoneCountry(normalized)) && normalized.length >= 9 && normalized.length <= 15;
}

export function isValidInternationalWhatsappPhoneInput(phone?: string | null): boolean {
  const rawPhone = String(phone || "").trim();

  return rawPhone.startsWith("+") && isValidWhatsappPhone(rawPhone);
}

export function getInternationalWhatsappPhoneError() {
  return INTERNATIONAL_PHONE_ERROR;
}

export function buildWhatsAppLink(phone?: string | null, message = ""): string {
  const normalizedPhone = normalizeWhatsappPhone(phone);

  if (!isValidWhatsappPhone(phone)) {
    console.warn("[whatsapp] Impossible de creer une URL WhatsApp: numero de telephone invalide", { phone });
    return "";
  }

  const baseUrl = `https://wa.me/${normalizedPhone}`;
  const cleanMessage = String(message || "");

  return cleanMessage ? `${baseUrl}?text=${encodeURIComponent(cleanMessage)}` : baseUrl;
}

export function buildWhatsAppShareLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function createWhatsappUrl(phone?: string | null, message = DEFAULT_WHATSAPP_MESSAGE): string {
  return buildWhatsAppLink(phone, message);
}

function getWhatsappPhoneCountry(normalizedPhone: string) {
  return [...phoneCountries]
    .sort((firstCountry, secondCountry) => secondCountry.dialCode.length - firstCountry.dialCode.length)
    .find((country) => {
      const dialCode = normalizeWhatsappPhone(country.dialCode);

      if (!normalizedPhone.startsWith(dialCode)) {
        return false;
      }

      const nationalNumber = normalizedPhone.slice(dialCode.length);
      const bounds = getNationalNumberBounds(country);

      return nationalNumber.length >= bounds.min && nationalNumber.length <= bounds.max;
    }) || null;
}
