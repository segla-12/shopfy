import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export default function StoresLoading() {
  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
        <div className="grid gap-3">
          <div className="h-4 w-24 rounded bg-orange-100 dark:bg-orange-400/20" />
          <div className="h-10 w-full max-w-xl rounded bg-gray-200 dark:bg-white/10" />
          <div className="h-5 w-full max-w-2xl rounded bg-gray-200 dark:bg-white/10" />
        </div>
        <div className="grid gap-4">
          <div className="h-56 rounded-lg bg-gray-200 dark:bg-white/10" />
          <div className="h-56 rounded-lg bg-gray-200 dark:bg-white/10" />
        </div>
      </section>
      <Footer />
    </main>
  );
}
