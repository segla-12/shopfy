const EXACT_TRANSLATIONS: Record<string, string> = {
  "vendeur shopfy": "Shopfy Seller",
  "fournisseur shopfy": "Shopfy Supplier",
  "fournisseur grossiste": "Wholesale supplier",
  fournisseur: "Supplier",
  grossiste: "Wholesaler",
  "a confirmer": "To confirm",
  "sur demande": "On request",
  "livraison locale": "Local delivery",
  camion: "Truck",
  moto: "Motorbike",
  "quantite minimale de commande": "Minimum order quantity",
  "prix de gros": "Wholesale Price",
};

const TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bboutique\s+(.+)$/i, "$1 Store"],
  [/\bquantite minimale de commande\b/gi, "minimum order quantity"],
  [/\bprix de gros\b/gi, "wholesale price"],
  [/\bprix negociable\b/gi, "negotiable price"],
  [/\blivraison locale\b/gi, "local delivery"],
  [/\btres bon etat\b/gi, "very good condition"],
  [/\blivraison disponible\b/gi, "delivery available"],
  [/\bbon etat\b/gi, "good condition"],
  [/\btelephone portable\b/gi, "mobile phone"],
  [/\btelephones\b/gi, "phones"],
  [/\btelephone\b/gi, "phone"],
  [/\bvetements?\b/gi, "clothing"],
  [/\bchaussures?\b/gi, "shoes"],
  [/\bsacs?\b/gi, "bags"],
  [/\bmontres?\b/gi, "watches"],
  [/\bpantalons?\b/gi, "pants"],
  [/\bchemises?\b/gi, "shirts"],
  [/\brobes?\b/gi, "dresses"],
  [/\bordinateur portable\b/gi, "laptop"],
  [/\bordinateurs?\b/gi, "computer"],
  [/\binformatique\b/gi, "computers"],
  [/\belectromenager\b/gi, "appliances"],
  [/\bvehicules?\b/gi, "vehicles"],
  [/\bvoitures?\b/gi, "cars"],
  [/\bcamions?\b/gi, "trucks"],
  [/\bmotos\b/gi, "motorbikes"],
  [/\bmoto\b/gi, "motorbike"],
  [/\bpieces?\b/gi, "pieces"],
  [/\bunites?\b/gi, "units"],
  [/\bcartons?\b/gi, "cartons"],
  [/\bboites?\b/gi, "boxes"],
  [/\blots?\b/gi, "lots"],
  [/\bneufs?\b/gi, "new"],
  [/\bnouvelles?\b/gi, "new"],
  [/\bnouveaux\b/gi, "new"],
  [/\boccasion\b/gi, "used"],
  [/\butilises?\b/gi, "used"],
  [/\bdisponibles?\b/gi, "available"],
  [/\bqualite\b/gi, "quality"],
  [/\boriginale?s?\b/gi, "original"],
  [/\bimportees?\b/gi, "imported"],
  [/\bimportes?\b/gi, "imported"],
  [/\bcommande\b/gi, "order"],
  [/\bminimum\b/gi, "minimum"],
  [/\bfournisseurs?\b/gi, "suppliers"],
  [/\bgrossistes?\b/gi, "wholesalers"],
  [/\blivraison\b/gi, "delivery"],
  [/\betat\b/gi, "condition"],
  [/\bprix\b/gi, "price"],
  [/\bavec\b/gi, "with"],
  [/\bsans\b/gi, "without"],
  [/\bpour\b/gi, "for"],
  [/\bet\b/gi, "and"],
];

export function toEnglishText(value: unknown, fallback = "") {
  const rawText = String(value ?? fallback).trim();

  if (!rawText) {
    return fallback;
  }

  const normalizedText = normalizeFrenchText(rawText);
  const exactTranslation = EXACT_TRANSLATIONS[normalizedText.toLowerCase()];

  if (exactTranslation) {
    return exactTranslation;
  }

  return TEXT_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    normalizedText,
  )
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function toEnglishOptionalText(value: unknown) {
  const translated = toEnglishText(value);
  return translated || undefined;
}

function normalizeFrenchText(value: string) {
  return value
    .replace(/\u00c3\u20ac/g, "A")
    .replace(/\u00c3\u00a0/g, "a")
    .replace(/\u00c3\u00a2/g, "a")
    .replace(/\u00c3\u00a7/g, "c")
    .replace(/\u00c3\u00a8/g, "e")
    .replace(/\u00c3\u00a9/g, "e")
    .replace(/\u00c3\u00aa/g, "e")
    .replace(/\u00c3\u00ae/g, "i")
    .replace(/\u00c3\u00b4/g, "o")
    .replace(/\u00c3\u00b9/g, "u")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
