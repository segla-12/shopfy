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
  const canonicalUrl = `https://shopfy.site/product/${encodeURIComponent(id)}`;
  const title = `Product ${id}`;
  const description = "View product details and contact the supplier on Shopfy.";

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
