const MAX_TEXT_LENGTH = 2000;
const MAX_IMAGE_LENGTH = 1_500_000;

export function cleanText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim().slice(0, MAX_TEXT_LENGTH);
}

export function cleanPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

export function cleanImage(value: unknown) {
  const image = cleanText(value);

  if (image.length > MAX_IMAGE_LENGTH) {
    return "";
  }

  return image;
}
