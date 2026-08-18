import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SellerDashboardMvp } from "@/components/store/SellerDashboardMvp";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/adminAuth";
import { getServerAuthUser } from "@/lib/serverAuth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Seller dashboard - Shopfy",
  description: "Manage a Shopfy seller store.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ adminStore?: string }>;
}) {
  const params = await searchParams;
  const adminStoreSlug = typeof params?.adminStore === "string" ? params.adminStore : "";
  const user = await getServerAuthUser();
  const hasAdminSession = adminStoreSlug
    ? isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value)
    : false;

  if (adminStoreSlug && !hasAdminSession) {
    redirect("/auth?next=/dashboard");
  }

  if (!user && !hasAdminSession) {
    redirect("/auth?next=/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <SellerDashboardMvp adminStoreSlug={adminStoreSlug} />
      <Footer />
    </main>
  );
}
