const DEFAULT_WHATSAPP_MESSAGE = "Je suis interesse par votre produit";

export function normalizeWhatsappPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function createWhatsappUrl(phone: string, message = DEFAULT_WHATSAPP_MESSAGE) {
  const normalizedPhone = normalizeWhatsappPhone(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
