import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SellerProfile } from "@/components/SellerProfile";

type SellerPageProps = {
  params: Promise<{
    phone: string;
  }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: SellerPageProps) {
  const { phone } = await params;

  return {
    title: `Supplier ${decodeURIComponent(phone)} - Shopfy`,
    description: "Shopfy wholesale supplier profile",
  };
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { phone } = await params;

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <SellerProfile sellerPhone={decodeURIComponent(phone)} />
      <Footer />
    </main>
  );
}
