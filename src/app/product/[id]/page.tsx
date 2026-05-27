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
    title: `Product ${id} - Shopfy`,
    description: "Shopfy product detail",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <ProductDetail productId={id} />
      <Footer />
    </main>
  );
}
