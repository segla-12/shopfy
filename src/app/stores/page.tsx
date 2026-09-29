import { cookies } from "next/headers";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StoresDirectory } from "@/components/store/StoresDirectory";
import { getPublicStores } from "@/lib/publicStores";
import { cleanText } from "@/lib/validation";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_COOKIE_KEY } from "@/lib/languageConfig";

export const metadata = {
  title: { absolute: "Shopfy | Votre boutique en ligne" },
  description: "Discover seller stores created on Shopfy.",
  alternates: {
    canonical: "https://shopfy.site/",
  },
  openGraph: {
    type: "website",
    url: "https://shopfy.site/",
    siteName: "Shopfy",
    title: "Shopfy | Votre boutique en ligne",
    description: "Discover seller stores created on Shopfy.",
    images: [
      {
        url: "/shopfy-logo-clean.png",
        type: "image/png",
        width: 640,
        height: 210,
        alt: "Shopfy official logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shopfy | Votre boutique en ligne",
    description: "Discover seller stores created on Shopfy.",
    images: [{ url: "/shopfy-logo-clean.png", alt: "Logo officiel Shopfy" }],
  },
};

type StoresPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function StoresPage({ searchParams }: StoresPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = cleanText(resolvedSearchParams?.q || "");
  const cookiesStore = await cookies();
  const languageCookie = cookiesStore.get(LANGUAGE_COOKIE_KEY)?.value;
  const language = isLanguage(languageCookie) ? languageCookie : DEFAULT_LANGUAGE;
  const stores = await getPublicStores();

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <StoresDirectory stores={stores} query={query} language={language} />
      <Footer />
    </main>
  );
}
