import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SellerDashboardMvp } from "@/components/store/SellerDashboardMvp";
import { getServerAuthUser } from "@/lib/serverAuth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Seller dashboard - Shopfy",
  description: "Manage a Shopfy seller store.",
};

export default async function DashboardPage() {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/auth?next=/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <SellerDashboardMvp />
      <Footer />
    </main>
  );
}
