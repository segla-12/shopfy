export type StoreKind = "personal" | "reseller";

export type StoreContact = {
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  whatsappPhone?: string;
};

export type ResellerStoreMetadata = {
  kind: StoreKind;
  reseller?: StoreContact;
  futureOwner?: StoreContact;
};

const metadataStart = "[SHOPFY_STORE_META]";
const metadataEnd = "[/SHOPFY_STORE_META]";

export function appendStoreMetadata(description: string, metadata: ResellerStoreMetadata) {
  return `${description.trim()}\n\n${metadataStart}${JSON.stringify(metadata)}${metadataEnd}`.trim();
}

export function splitStoreDescriptionMetadata(description?: string | null) {
  const rawDescription = String(description || "");
  const startIndex = rawDescription.indexOf(metadataStart);
  const endIndex = rawDescription.indexOf(metadataEnd);

  if (startIndex < 0 || endIndex < startIndex) {
    return {
      description: rawDescription,
      metadata: { kind: "personal" as const },
    };
  }

  const json = rawDescription.slice(startIndex + metadataStart.length, endIndex);
  const cleanDescription = `${rawDescription.slice(0, startIndex)}${rawDescription.slice(endIndex + metadataEnd.length)}`.trim();

  try {
    const parsed = JSON.parse(json) as ResellerStoreMetadata;

    return {
      description: cleanDescription,
      metadata: {
        kind: parsed.kind === "reseller" ? "reseller" as const : "personal" as const,
        reseller: cleanContact(parsed.reseller),
        futureOwner: cleanContact(parsed.futureOwner),
      },
    };
  } catch {
    return {
      description: cleanDescription,
      metadata: { kind: "personal" as const },
    };
  }
}

export function getContactDisplayName(contact?: StoreContact | null) {
  return [contact?.lastName, contact?.firstName].filter(Boolean).join(" ").trim();
}

function cleanContact(contact?: StoreContact) {
  if (!contact) {
    return undefined;
  }

  return {
    firstName: clean(contact.firstName),
    lastName: clean(contact.lastName),
    country: clean(contact.country),
    city: clean(contact.city),
    whatsappPhone: clean(contact.whatsappPhone),
  };
}

function clean(value?: string) {
  return String(value || "").trim();
}
