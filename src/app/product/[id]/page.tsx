import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProductDetail } from "@/components/ProductDetail";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;

  return {
    title: `Produit ${id} - Shopfy`,
    description: "Detail produit Shopfy",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <ProductDetail productId={id} />
      <Footer />
    </main>
  );
}
