const MAX_TEXT_LENGTH = 2000;
const MAX_IMAGE_LENGTH = 1_500_000;
const CONTROL_CHARS_PATTERN = /[\u0000-\u001f\u007f]/g;
const HTML_BRACKET_PATTERN = /[<>]/g;
const SQL_COMMENT_PATTERN = /(--|\/\*|\*\/)/g;

export function cleanText(value: unknown, fallback = "") {
  return String(value ?? fallback)
    .replace(CONTROL_CHARS_PATTERN, "")
    .replace(/'/g, "''") // Neutralise les injections SQL basiques en doublant les apostrophes
    .replace(HTML_BRACKET_PATTERN, "")
    .replace(SQL_COMMENT_PATTERN, "")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

export function cleanPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

export function cleanImage(value: unknown) {
  const image = String(value ?? "").trim();

  if (image.length > MAX_IMAGE_LENGTH) {
    return "";
  }

  if (image.startsWith("data:image/")) {
    return /^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i.test(image) ? image : "";
  }

  try {
    const url = new URL(image);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) && email.length <= 254;
}

export function hasUnsafeObjectKeys(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some(hasUnsafeObjectKeys);
  }

  return Object.entries(value as Record<string, unknown>).some(([key, childValue]) => (
    key.startsWith("$") ||
    key.includes(".") ||
    key === "__proto__" ||
    key === "constructor" ||
    key === "prototype" ||
    hasUnsafeObjectKeys(childValue)
  ));
}
