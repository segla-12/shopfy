export const MAX_PRODUCT_IMAGES = 3;

const WHOLESALE_META_PREFIX = "<!--SHOPFY_WHOLESALE_META:";
const WHOLESALE_META_PATTERN = /\s*<!--SHOPFY_WHOLESALE_META:([\s\S]*?)-->\s*$/;

export type ProductWholesaleMetadata = {
  version: 1;
  minimumOrderQuantity?: string;
  images?: string[];
  delivery?: {
    method?: string;
    serviceName?: string;
    contact?: string;
  };
  geo?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
};

export function buildWholesaleDescription(description: string, metadata: ProductWholesaleMetadata) {
  const displayDescription = extractWholesaleMetadata(description).description;
  const cleanMetadata = normalizeWholesaleMetadata(metadata);

  if (!hasWholesaleMetadata(cleanMetadata)) {
    return displayDescription;
  }

  return `${displayDescription}\n\n${WHOLESALE_META_PREFIX}${encodeURIComponent(JSON.stringify(cleanMetadata))}-->`;
}

export function extractWholesaleMetadata(description: string) {
  const source = description || "";
  const match = source.match(WHOLESALE_META_PATTERN);

  if (!match) {
    return {
      description: source.trim(),
      metadata: { version: 1 } satisfies ProductWholesaleMetadata,
    };
  }

  try {
    const parsedMetadata = JSON.parse(decodeURIComponent(match[1])) as ProductWholesaleMetadata;
    const metadata = normalizeWholesaleMetadata(parsedMetadata);
    const matchStart = match.index ?? source.length;

    return {
      description: source.slice(0, matchStart).trim(),
      metadata,
    };
  } catch {
    return {
      description: source.trim(),
      metadata: { version: 1 } satisfies ProductWholesaleMetadata,
    };
  }
}

export function getProductImages(primaryImage: string, metadataImages: string[] | undefined) {
  const images = [primaryImage, ...(metadataImages || [])]
    .map((image) => image.trim())
    .filter(Boolean)
    .filter((image, index, list) => list.indexOf(image) === index)
    .slice(0, MAX_PRODUCT_IMAGES);

  return images.length > 0 ? images : [primaryImage];
}

function normalizeWholesaleMetadata(metadata: ProductWholesaleMetadata): ProductWholesaleMetadata {
  const source = metadata && typeof metadata === "object" ? metadata : ({ version: 1 } as ProductWholesaleMetadata);
  const cleanMetadata: ProductWholesaleMetadata = { version: 1 };
  const minimumOrderQuantity = cleanText(source.minimumOrderQuantity);
  const sourceImages = Array.isArray(source.images) ? source.images : [];
  const images = sourceImages.filter(isUsefulText).slice(0, MAX_PRODUCT_IMAGES);
  const deliveryMethod = cleanText(source.delivery?.method);
  const deliveryServiceName = cleanText(source.delivery?.serviceName);
  const deliveryContact = cleanText(source.delivery?.contact);
  const country = cleanText(source.geo?.country);
  const city = cleanText(source.geo?.city);
  const latitude = cleanCoordinate(source.geo?.latitude, -90, 90);
  const longitude = cleanCoordinate(source.geo?.longitude, -180, 180);

  if (minimumOrderQuantity) {
    cleanMetadata.minimumOrderQuantity = minimumOrderQuantity;
  }

  if (images.length > 0) {
    cleanMetadata.images = images;
  }

  if (deliveryMethod || deliveryServiceName || deliveryContact) {
    cleanMetadata.delivery = {
      ...(deliveryMethod ? { method: deliveryMethod } : {}),
      ...(deliveryServiceName ? { serviceName: deliveryServiceName } : {}),
      ...(deliveryContact ? { contact: deliveryContact } : {}),
    };
  }

  if (country || city || latitude !== undefined || longitude !== undefined) {
    cleanMetadata.geo = {
      ...(country ? { country } : {}),
      ...(city ? { city } : {}),
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
    };
  }

  return cleanMetadata;
}

function hasWholesaleMetadata(metadata: ProductWholesaleMetadata) {
  return Boolean(
    metadata.minimumOrderQuantity ||
    metadata.images?.length ||
    metadata.delivery ||
    metadata.geo,
  );
}

function cleanText(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const text = String(value).trim();
  return text || undefined;
}

function isUsefulText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanCoordinate(value: unknown, min: number, max: number) {
  const numberValue = typeof value === "string" ? Number(value) : value;

  if (typeof numberValue !== "number" || !Number.isFinite(numberValue)) {
    return undefined;
  }

  if (numberValue < min || numberValue > max) {
    return undefined;
  }

  return numberValue;
}
