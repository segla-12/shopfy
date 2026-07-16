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

  return {
    title: `Supplier ${sellerPhone || "Shopfy"} - Shopfy`,
    description: "Shopfy wholesale supplier profile",
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
