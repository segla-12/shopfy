import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CreateStoreWizard } from "@/components/store/CreateStoreWizard";

export const metadata = {
  title: "Create store - Shopfy",
  description: "Create a seller store with a public Shopfy link.",
};

export default function CreateStorePage() {
  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <CreateStoreWizard />
      <Footer />
    </main>
  );
}
