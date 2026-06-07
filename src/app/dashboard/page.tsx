import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SellerDashboardMvp } from "@/components/store/SellerDashboardMvp";

export const metadata = {
  title: "Seller dashboard - Shopfy",
  description: "Manage a Shopfy seller store.",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <SellerDashboardMvp />
      <Footer />
    </main>
  );
}
