import type { ProductCategory } from "@/types/marketplace";

export const productCategories: ProductCategory[] = [
  "Telephones",
  "Mode / Vetements",
  "Informatique",
  "Maison & electromenager",
  "Vehicules",
  "Autres",
];

export const categories = ["Tous", ...productCategories] as const;
