"use client";

/* eslint-disable @next/next/no-img-element */
import { FormEvent, useState } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { formatPrice } from "@/lib/format";
import { getProducts } from "@/services/productService";
import type { Product } from "@/types/marketplace";
import { CertifiedBadge } from "@/ui/CertifiedBadge";

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/certification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ adminSecret }),
    });
    const result = await response.json();

    if (!result.success) {
      setMessage(result.message || "Code admin incorrect.");
      setIsLoading(false);
      return;
    }

    const loadedProducts = await getProducts();

    setProducts(loadedProducts);
    setIsUnlocked(true);
    setIsLoading(false);
  }

  async function handleCertification(product: Product, isCertified: boolean) {
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/certification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminSecret,
        productId: product.id,
        isCertified,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.message || "Action refusee.");
      setIsLoading(false);
      return;
    }

    const loadedProducts = await getProducts();
    setProducts(loadedProducts);
    setMessage(isCertified ? "Annonce certifiee." : "Certification retiree.");
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">Administration</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950">Certification des annonces</h1>
          <p className="mt-3 max-w-2xl leading-7 text-gray-600">
            Page privee non liee dans la navigation. Entre ton code admin pour gerer les badges.
          </p>
        </div>

        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="grid max-w-xl gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-8">
            <label className="grid gap-2">
              <span className="text-sm font-black text-gray-900">Code admin</span>
              <input
                value={adminSecret}
                onChange={(event) => setAdminSecret(event.target.value)}
                required
                type="password"
                placeholder="Entrez le code admin"
                className="min-h-12 rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <button disabled={isLoading} className="min-h-12 rounded-full bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-70">
              {isLoading ? "Verification..." : "Entrer"}
            </button>
          </form>
        ) : (
          <div className="grid gap-4">
            {message ? (
              <p className="rounded-2xl border border-gray-100 bg-white p-4 text-sm font-bold text-gray-700">
                {message}
              </p>
            ) : null}

            {products.map((product) => (
              <article key={product.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <img src={product.image} alt={product.title} className="h-28 w-28 rounded-xl object-contain" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-gray-950">{product.title}</h2>
                      {product.isCertified ? <CertifiedBadge /> : null}
                    </div>
                    <p className="mt-1 font-black text-orange-500">{formatPrice(product.price)} FCFA</p>
                    <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                  </div>

                  <div className="grid gap-2 sm:w-52">
                    <button
                      onClick={() => handleCertification(product, true)}
                      disabled={isLoading || product.isCertified}
                      className="min-h-10 rounded-full bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Certifier
                    </button>
                    <button
                      onClick={() => handleCertification(product, false)}
                      disabled={isLoading || !product.isCertified}
                      className="min-h-10 rounded-full border border-gray-200 px-4 text-sm font-black text-gray-900 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Retirer certification
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
