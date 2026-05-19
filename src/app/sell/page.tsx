"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { productCategories } from "@/data/categories";
import { createProduct } from "@/services/productService";
import type { ProductCategory } from "@/types/marketplace";

const fallbackImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SellPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const imageFile = formData.get("image");
    const image = imageFile instanceof File && imageFile.size > 0
      ? await fileToDataUrl(imageFile)
      : fallbackImage;

    const product = await createProduct({
      title: String(formData.get("title") || ""),
      price: Number(formData.get("price") || 0),
      category: String(formData.get("category") || "Telephones") as ProductCategory,
      image,
      images: [image],
      description: String(formData.get("description") || ""),
      location: String(formData.get("location") || ""),
      sellerPhone: String(formData.get("sellerPhone") || ""),
    });

    setIsSaving(false);

    if (!product) {
      setErrorMessage("Impossible de publier l'annonce. Verifiez les autorisations Supabase de la table products.");
      return;
    }

    router.push("/");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-50">
      <Navbar />

      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">Nouvelle annonce</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">Publier une annonce</h1>
          <p className="mt-3 max-w-2xl leading-7 text-gray-600">
            Cette annonce sera enregistrée et pour la modifier ou supprimer, insérez votre numéro de téléphone.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid w-full max-w-full gap-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 md:p-8">
          {errorMessage ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="grid w-full max-w-full gap-5 md:grid-cols-2">
            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">Titre</span>
              <input name="title" required maxLength={80} placeholder="Ex: iPhone 13" className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">Prix</span>
              <input name="price" required type="number" min="1" placeholder="Ex: 350000" className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">Categorie obligatoire</span>
              <select name="category" className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100">
                {productCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">Localisation</span>
              <input name="location" required placeholder="Ex: Cotonou" className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className="text-sm font-black text-gray-900">Numero vendeur</span>
              <input name="sellerPhone" required type="tel" placeholder="Le numero qui permettra de modifier ou supprimer" className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className="text-sm font-black text-gray-900">Image</span>
              <input name="image" type="file" accept="image/*" className="w-full max-w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm" />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className="text-sm font-black text-gray-900">Description</span>
              <textarea name="description" required rows={5} placeholder="Etat du produit, details importants..." className="w-full max-w-full resize-y rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>
          </div>

          <button disabled={isSaving} className="min-h-12 w-full max-w-full rounded-full bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:justify-self-start">
            {isSaving ? "Publication..." : "Publier l'annonce"}
          </button>
        </form>
      </section>

      <Footer />
    </main>
  );
}
