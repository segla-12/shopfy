import Link from "next/link";
import { cookies } from "next/headers";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_COOKIE_KEY } from "@/lib/languageConfig";
import type { ShopfyStore } from "@/types/storefront";
import { Storefront } from "./Storefront";

type StorefrontResolverProps = {
  slug: string;
  initialStore: ShopfyStore | null;
};

export async function StorefrontResolver({ initialStore }: StorefrontResolverProps) {
  const cookiesStore = await cookies();
  const languageCookie = cookiesStore.get(LANGUAGE_COOKIE_KEY)?.value;
  const language = isLanguage(languageCookie) ? languageCookie : DEFAULT_LANGUAGE;
  const copy = getResolverCopy(language);

  if (!initialStore) {
    return (
      <section className="mx-auto grid max-w-4xl gap-4 px-4 py-12">
        <p className="text-sm font-black uppercase tracking-wide text-orange-500">{copy.kicker}</p>
        <h1 className="text-3xl font-black text-gray-950 dark:text-white">{copy.title}</h1>
        <p className="text-base leading-7 text-gray-600 dark:text-gray-300">{copy.description}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/create-store"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600"
          >
            {copy.createStore}
          </Link>
          <Link
            href="/stores"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-black text-gray-900 transition hover:border-orange-200 hover:text-orange-600 dark:border-white/10 dark:text-gray-100"
          >
            {copy.viewStores}
          </Link>
        </div>
      </section>
    );
  }

  return <Storefront store={initialStore} />;
}

function getResolverCopy(language: string) {
  if (language === "fr") {
    return {
      loading: "Chargement de la boutique...",
      kicker: "Boutique introuvable",
      title: "Cette boutique n'existe pas encore",
      description: "Creez une boutique pour obtenir un lien public du type https://shopfy.site/store/nom-boutique.",
      createStore: "Créer boutique",
      viewStores: "Voir les boutiques",
    };
  }

  return {
    loading: "Loading store...",
    kicker: "Store not found",
    title: "This store does not exist yet",
    description: "Create a store to get a public link like https://shopfy.site/store/store-name.",
    createStore: "Create store",
    viewStores: "View stores",
  };
}
