import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SourcingHub } from "@/components/store/SourcingHub";
import { supplierSourceProducts } from "@/lib/demoStores";

export const metadata = {
  title: "Supplier sourcing - Shopfy",
  description: "Source supplier products and import them into a Shopfy seller store.",
};

export default function SourcingPage() {
  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <SourcingHub products={supplierSourceProducts} />
      <Footer />
    </main>
  );
}
