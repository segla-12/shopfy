"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { productCategories } from "@/data/categories";
import { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/language";
import { createProduct } from "@/services/productService";
import type { ProductCategory } from "@/types/marketplace";
import { PhoneInput } from "@/ui/PhoneInput";

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
  const { t, categoryLabel } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessageKey, setErrorMessageKey] = useState<TranslationKey | "">("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessageKey("");

    const formData = new FormData(event.currentTarget);
    const imageFile = formData.get("image");
    const sellerPhotoFile = formData.get("sellerPhoto");
    const image = imageFile instanceof File && imageFile.size > 0
      ? await fileToDataUrl(imageFile)
      : fallbackImage;
    const sellerPhoto = sellerPhotoFile instanceof File && sellerPhotoFile.size > 0
      ? await fileToDataUrl(sellerPhotoFile)
      : undefined;
    const location = String(formData.get("location") || "");

    const product = await createProduct({
      title: String(formData.get("title") || ""),
      price: Number(formData.get("price") || 0),
      category: String(formData.get("category") || "Telephones") as ProductCategory,
      image,
      images: [image],
      description: String(formData.get("description") || ""),
      location,
      city: location,
      country: String(formData.get("sellerCountry") || ""),
      sellerPhone: String(formData.get("sellerPhone") || ""),
      sellerName: String(formData.get("sellerName") || "Vendeur Shopfy"),
      sellerPhoto,
    });

    setIsSaving(false);

    if (!product) {
      setErrorMessageKey("sell.error");
      return;
    }

    router.push("/");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />

      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">{t("sell.kicker")}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl dark:text-white">{t("sell.title")}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-gray-600 dark:text-gray-300">
            {t("sell.description")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid w-full max-w-full gap-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 md:p-8 dark:border-white/10 dark:bg-gray-900">
          {errorMessageKey ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {t(errorMessageKey)}
            </p>
          ) : null}

          <div className="grid w-full max-w-full gap-5 md:grid-cols-2">
            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{t("sell.titleLabel")}</span>
              <input name="title" required maxLength={80} placeholder={t("sell.titlePlaceholder")} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{t("sell.priceLabel")}</span>
              <input name="price" required type="number" min="1" placeholder={t("sell.pricePlaceholder")} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{t("sell.categoryLabel")}</span>
              <select name="category" className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100">
                {productCategories.map((category) => (
                  <option key={category} value={category}>{categoryLabel(category)}</option>
                ))}
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{t("sell.locationLabel")}</span>
              <input name="location" required placeholder={t("sell.locationPlaceholder")} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <PhoneInput className="md:col-span-2" />

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{t("sell.sellerNameLabel")}</span>
              <input name="sellerName" placeholder={t("sell.sellerNamePlaceholder")} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{t("sell.sellerPhotoLabel")}</span>
              <input name="sellerPhoto" type="file" accept="image/*" className="w-full max-w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm" />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className="text-sm font-black text-gray-900">{t("sell.imageLabel")}</span>
              <input name="image" type="file" accept="image/*" className="w-full max-w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm" />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className="text-sm font-black text-gray-900">{t("sell.descriptionLabel")}</span>
              <textarea name="description" required rows={5} placeholder={t("sell.descriptionPlaceholder")} className="w-full max-w-full resize-y rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>
          </div>

          <button disabled={isSaving} className="min-h-12 w-full max-w-full rounded-full bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:justify-self-start">
            {isSaving ? t("sell.publishing") : t("sell.publish")}
          </button>
        </form>
      </section>

      <Footer />
    </main>
  );
}
