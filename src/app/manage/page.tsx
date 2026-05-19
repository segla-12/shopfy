"use client";

/* eslint-disable @next/next/no-img-element */
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { productCategories } from "@/data/categories";
import { formatPrice } from "@/lib/format";
import {
  deleteProductByPhone,
  getProductsByPhone,
  updateProductByPhone,
} from "@/services/productService";
import type { Product, ProductCategory } from "@/types/marketplace";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ManagePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setSelectedProduct(null);

    const results = await getProductsByPhone(phone);

    setProducts(results);
    setIsLoading(false);

    if (results.length === 0) {
      setMessage("Aucune annonce trouvee pour ce numero.");
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const imageFile = formData.get("image");
    const image = imageFile instanceof File && imageFile.size > 0
      ? await fileToDataUrl(imageFile)
      : selectedProduct.image;

    const updatedProduct = await updateProductByPhone(
      {
        productId: selectedProduct.id,
        sellerPhone: phone,
      },
      {
        title: String(formData.get("title") || ""),
        price: Number(formData.get("price") || 0),
        image,
        description: String(formData.get("description") || ""),
        location: String(formData.get("location") || ""),
        category: String(formData.get("category") || "Autres") as ProductCategory,
      },
    );

    if (!updatedProduct) {
      setMessage("Modification refusee. Verifiez que le numero correspond a cette annonce.");
      setIsLoading(false);
      return;
    }

    const refreshedProducts = await getProductsByPhone(phone);
    setProducts(refreshedProducts);
    setSelectedProduct(updatedProduct);
    setMessage("Modification réussie.");
    setIsLoading(false);

    window.setTimeout(() => {
      router.push("/#products");
    }, 900);
  }

  async function handleDelete(product: Product) {
    setIsLoading(true);
    setMessage("");

    const deleted = await deleteProductByPhone({
      productId: product.id,
      sellerPhone: phone,
    });

    if (!deleted) {
      setMessage("Suppression refusee. Verifiez que le numero correspond a cette annonce.");
      setIsLoading(false);
      return;
    }

    const refreshedProducts = await getProductsByPhone(phone);
    setProducts(refreshedProducts);
    setSelectedProduct(null);
    setMessage("Annonce supprimee avec succes.");
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">Gestion annonce</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950">Modifier ou supprimer une annonce</h1>
          <p className="mt-3 max-w-2xl leading-7 text-gray-600">
            Entrez le même numéro que celui utiliser lors de la publication.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row">
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            type="tel"
            placeholder="Numéro utiliser pour publier"
            className="min-h-12 flex-1 rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          />
          <button disabled={isLoading} className="min-h-12 rounded-full bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-70">
            {isLoading ? "Recherche..." : "Retrouver mes annonces"}
          </button>
        </form>

        {message ? (
          <p className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 text-sm font-bold text-gray-700">
            {message}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3">
            {products.map((product) => (
              <article key={product.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex gap-4">
                  <img src={product.image} alt={product.title} className="h-24 w-24 rounded-xl object-contain" />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-black text-gray-950">{product.title}</h2>
                    <p className="mt-1 font-black text-orange-500">{formatPrice(product.price)} FCFA</p>
                    <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button onClick={() => setSelectedProduct(product)} className="min-h-10 rounded-full border border-gray-200 text-sm font-bold text-gray-900 transition hover:border-orange-200 hover:text-orange-600">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(product)} className="min-h-10 rounded-full bg-red-500 text-sm font-bold text-white transition hover:bg-red-600">
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
          </div>

          {selectedProduct ? (
            <form onSubmit={handleUpdate} className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-8">
              <h2 className="text-2xl font-black text-gray-950">Modifier l&apos;annonce</h2>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">Titre</span>
                <input name="title" required defaultValue={selectedProduct.title} className="min-h-12 rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">Prix</span>
                <input name="price" required type="number" min="1" defaultValue={selectedProduct.price} className="min-h-12 rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">Categorie</span>
                <select name="category" defaultValue={selectedProduct.category} className="min-h-12 rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100">
                  {productCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">Localisation</span>
                <input name="location" defaultValue={selectedProduct.location || ""} className="min-h-12 rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">Image</span>
                <input name="image" type="file" accept="image/*" className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">Description</span>
                <textarea name="description" required rows={5} defaultValue={selectedProduct.description} className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>

              <button disabled={isLoading} className="min-h-12 rounded-full bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-70">
                {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <Footer />
    </main>
  );
}
