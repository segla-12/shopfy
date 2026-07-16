import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CreateStoreWizard } from "@/components/store/CreateStoreWizard";
import { getServerAuthUser } from "@/lib/serverAuth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Create store - Shopfy",
  description: "Create a seller store with a public Shopfy link.",
};

export default async function CreateStorePage() {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/auth?next=/create-store");
  }

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <CreateStoreWizard />
      <Footer />
    </main>
  );
}
