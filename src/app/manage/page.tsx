"use client";

/* eslint-disable @next/next/no-img-element */
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { productCategories } from "@/data/categories";
import { formatPrice } from "@/lib/format";
import { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/language";
import {
  deleteProductByPhone,
  getProductsByPhone,
  updateProductByPhone,
} from "@/services/productService";
import { uploadImageFile } from "@/services/imageService";
import type { Product, ProductCategory } from "@/types/marketplace";
import { PhoneInput } from "@/ui/PhoneInput";

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
  const { t, categoryLabel } = useLanguage();
  const [sellerPhone, setSellerPhone] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [messageKey, setMessageKey] = useState<TranslationKey | "">("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessageKey("");
    setSelectedProduct(null);

    const results = await getProductsByPhone(sellerPhone);

    setProducts(results);
    setIsLoading(false);

    if (results.length === 0) {
      setMessageKey("manage.noProducts");
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct) {
      return;
    }

    setIsLoading(true);
    setMessageKey("");

    const formData = new FormData(event.currentTarget);
    const imageFile = formData.get("image");
    const image = imageFile instanceof File && imageFile.size > 0
      ? await uploadImageFile(imageFile)
      : selectedProduct.image;

    const updatedProduct = await updateProductByPhone(
      {
        productId: selectedProduct.id,
        sellerPhone,
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
      setMessageKey("manage.updateDenied");
      setIsLoading(false);
      return;
    }

    const refreshedProducts = await getProductsByPhone(sellerPhone);
    setProducts(refreshedProducts);
    setSelectedProduct(updatedProduct);
    setMessageKey("manage.updateSuccess");
    setIsLoading(false);

    window.setTimeout(() => {
      router.push("/#products");
    }, 900);
  }

  async function handleDelete(product: Product) {
    setIsLoading(true);
    setMessageKey("");

    const deleted = await deleteProductByPhone({
      productId: product.id,
      sellerPhone,
    });

    if (!deleted) {
      setMessageKey("manage.deleteDenied");
      setIsLoading(false);
      return;
    }

    const refreshedProducts = await getProductsByPhone(sellerPhone);
    setProducts(refreshedProducts);
    setSelectedProduct(null);
    setMessageKey("manage.deleteSuccess");
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{t("manage.kicker")}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950 dark:text-white">{t("manage.title")}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-gray-600 dark:text-gray-300">
            {t("manage.description")}
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-6 grid gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-2">
            <PhoneInput
              name="sellerPhone"
              label={t("phone.manageLabel")}
              value={sellerPhone}
              onChange={setSellerPhone}
            />
            <p className="text-xs font-bold leading-5 text-gray-500 dark:text-gray-400">
              {t("manage.supplierPhoneHelper")}
            </p>
          </div>
          <button disabled={isLoading} className="min-h-12 rounded-full bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-70">
            {isLoading ? t("manage.searching") : t("manage.searchButton")}
          </button>
        </form>

        {messageKey ? (
          <p className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 text-sm font-bold text-gray-700">
            {t(messageKey)}
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
                    <p className="mt-1 text-sm text-gray-500">{categoryLabel(product.category)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button onClick={() => setSelectedProduct(product)} className="min-h-10 rounded-full border border-gray-200 text-sm font-bold text-gray-900 transition hover:border-orange-200 hover:text-orange-600">
                    {t("manage.edit")}
                  </button>
                  <button onClick={() => handleDelete(product)} className="min-h-10 rounded-full bg-red-500 text-sm font-bold text-white transition hover:bg-red-600">
                    {t("manage.delete")}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {selectedProduct ? (
            <form onSubmit={handleUpdate} className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-8">
              <h2 className="text-2xl font-black text-gray-950">{t("manage.editTitle")}</h2>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">{t("sell.titleLabel")}</span>
                <input name="title" required suppressHydrationWarning defaultValue={selectedProduct.title} className="min-h-12 rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">{t("sell.priceLabel")}</span>
                <input name="price" required type="number" min="1" suppressHydrationWarning defaultValue={selectedProduct.price} className="min-h-12 rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">{t("manage.categoryLabel")}</span>
                <select name="category" defaultValue={selectedProduct.category} suppressHydrationWarning className="min-h-12 rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100">
                  {productCategories.map((category) => (
                    <option key={category} value={category}>{categoryLabel(category)}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">{t("sell.locationLabel")}</span>
                <input name="location" suppressHydrationWarning defaultValue={selectedProduct.location || ""} className="min-h-12 rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">{t("sell.imageLabel")}</span>
                <input name="image" type="file" accept="image/*" suppressHydrationWarning className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-900">{t("sell.descriptionLabel")}</span>
                <textarea name="description" required rows={5} suppressHydrationWarning defaultValue={selectedProduct.description} className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>

              <button disabled={isLoading} className="min-h-12 rounded-full bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-70">
                {isLoading ? t("manage.saving") : t("manage.save")}
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <Footer />
    </main>
  );
}
