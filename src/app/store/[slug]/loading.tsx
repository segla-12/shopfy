import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export default function StoreLoading() {
  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-6">
        <div className="h-80 rounded-lg bg-gray-200 dark:bg-white/10" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-20 rounded-lg bg-gray-200 dark:bg-white/10" />
          <div className="h-20 rounded-lg bg-gray-200 dark:bg-white/10" />
        </div>
      </section>
      <Footer />
    </main>
  );
}
