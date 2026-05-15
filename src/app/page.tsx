import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/sections/Hero";
import { MarketplaceSection } from "@/sections/MarketplaceSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <Hero />
      <MarketplaceSection />
      <Footer />
    </main>
  );
}
