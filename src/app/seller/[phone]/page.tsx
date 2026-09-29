import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SellerProfile } from "@/components/SellerProfile";

type SellerPageProps = {
  params: Promise<{
    phone: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: SellerPageProps) {
  const { phone } = await params;
  const sellerPhone = safeDecodeRouteParam(phone);
  const canonicalUrl = `https://shopfy.site/seller/${encodeURIComponent(sellerPhone)}`;
  const title = "Supplier profile";
  const description = "Explore a wholesale supplier profile and product catalog on Shopfy.";

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: "Shopfy",
      title: `${title} | Shopfy`,
      description,
      images: ["/shopfy-logo-clean.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Shopfy`,
      description,
      images: ["/shopfy-logo-clean.png"],
    },
  };
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { phone } = await params;
  const sellerPhone = safeDecodeRouteParam(phone);

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <SellerProfile sellerPhone={sellerPhone.trim()} />
      <Footer />
    </main>
  );
}

function safeDecodeRouteParam(value: string) {
  const rawValue = String(value || "");

  try {
    return decodeURIComponent(rawValue);
  } catch (error) {
    console.warn("[seller] Invalid encoded supplier route parameter.", {
      value: rawValue,
      error: error instanceof Error ? error.message : String(error),
    });

    return rawValue;
  }
}
