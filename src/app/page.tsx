import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StoresDirectory } from "@/components/store/StoresDirectory";
import { getPublicStores } from "@/lib/publicStores";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_COOKIE_KEY } from "@/lib/languageConfig";
import { cleanText } from "@/lib/validation";
import type { ShopfyStore } from "@/types/storefront";

const platformDescription =
  "Shopfy is a modern marketplace connecting buyers with trusted wholesale suppliers and storefronts.";

export const metadata: Metadata = {
  title: { absolute: "Shopfy | Votre boutique en ligne" },
  description: platformDescription,
  alternates: { canonical: "https://shopfy.site/" },
  openGraph: {
    type: "website",
    url: "https://shopfy.site/",
    siteName: "Shopfy",
    title: "Shopfy | Votre boutique en ligne",
    description: platformDescription,
    images: [
      {
        url: "/shopfy-logo-clean.png",
        type: "image/png",
        width: 640,
        height: 210,
        alt: "Logo officiel Shopfy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@shopfy",
    title: "Shopfy | Votre boutique en ligne",
    description: platformDescription,
    images: [{ url: "/shopfy-logo-clean.png", alt: "Logo officiel Shopfy" }],
  },
};

type HomePageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const query = cleanText(params?.q || "");
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get(LANGUAGE_COOKIE_KEY)?.value;
  const language = isLanguage(languageCookie) ? languageCookie : DEFAULT_LANGUAGE;
  const stores: ShopfyStore[] = await getPublicStores();

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <StoresDirectory stores={stores} query={query} language={language} />
      <Footer />
    </main>
  );
}
