import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SellerAuth } from "@/components/auth/SellerAuth";

export const metadata = {
  title: "Seller account - Shopfy",
  description: "Sign in or create a seller account to manage a Shopfy store.",
};

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <SellerAuth />
      <Footer />
    </main>
  );
}
