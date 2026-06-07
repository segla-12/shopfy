import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StoresDirectory } from "@/components/store/StoresDirectory";
import { demoStores } from "@/lib/demoStores";

export const metadata = {
  title: "Seller stores - Shopfy",
  description: "Discover seller stores created on Shopfy.",
};

export default function StoresPage() {
  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <StoresDirectory stores={demoStores} />
      <Footer />
    </main>
  );
}
