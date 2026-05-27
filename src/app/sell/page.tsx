"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { productCategories } from "@/data/categories";
import { toEnglishText } from "@/lib/englishText";
import { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/language";
import { buildEnglishWholesaleDescription, MAX_PRODUCT_IMAGES } from "@/lib/productWholesale";
import { getSupplierProfileHref } from "@/lib/seller";
import { createProduct } from "@/services/productService";
import type { ProductCategory } from "@/types/marketplace";
import { PhoneInput } from "@/ui/PhoneInput";

const fallbackImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80";
const SUPPLIER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fileToDataUrl(file: File, maxSize = 1280): Promise<string> {
  const source = await readFileAsDataUrl(file);

  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return source;
  }

  return new Promise((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");

      if (!context) {
        resolve(source);
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => resolve(source);
    image.src = source;
  });
}

export default function SellPage() {
  const router = useRouter();
  const { language, t, categoryLabel } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessageKey, setErrorMessageKey] = useState<TranslationKey | "">("");
  const [formError, setFormError] = useState("");
  const [selectedImageCount, setSelectedImageCount] = useState(0);
  const [supplierImagePreview, setSupplierImagePreview] = useState("");
  const copy = getSellWholesaleCopy(language);

  function handleProductImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files || []).filter((file) => file.size > 0);

    if (files.length > MAX_PRODUCT_IMAGES) {
      event.currentTarget.value = "";
      setSelectedImageCount(0);
      setFormError(copy.imageLimit);
      return;
    }

    setSelectedImageCount(files.length);
    setFormError("");
  }

  async function handleSupplierPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    event.currentTarget.setCustomValidity("");
    setSupplierImagePreview("");

    if (!file) {
      event.currentTarget.setCustomValidity(copy.supplierImageRequired);
      setFormError(copy.supplierImageRequired);
      return;
    }

    if (!isAllowedSupplierImage(file)) {
      event.currentTarget.setCustomValidity(copy.supplierImageFormat);
      event.currentTarget.value = "";
      setFormError(copy.supplierImageFormat);
      return;
    }

    setFormError("");
    setSupplierImagePreview(await fileToDataUrl(file, 360));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessageKey("");
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const imageFiles = formData
      .getAll("images")
      .filter((item): item is File => item instanceof File && item.size > 0);
    const sellerPhotoFile = formData.get("sellerPhoto");
    const city = String(formData.get("city") || "").trim();
    const country = String(formData.get("sellerCountry") || "");
    const latitude = parseOptionalNumber(formData.get("latitude"));
    const longitude = parseOptionalNumber(formData.get("longitude"));

    if (!(sellerPhotoFile instanceof File) || sellerPhotoFile.size === 0) {
      setFormError(copy.supplierImageRequired);
      setIsSaving(false);
      return;
    }

    if (!isAllowedSupplierImage(sellerPhotoFile)) {
      setFormError(copy.supplierImageFormat);
      setIsSaving(false);
      return;
    }

    if (imageFiles.length > MAX_PRODUCT_IMAGES) {
      setFormError(copy.imageLimit);
      setIsSaving(false);
      return;
    }

    const uploadedImages = imageFiles.length > 0
      ? await Promise.all(imageFiles.map((file) => fileToDataUrl(file)))
      : [];
    const productImages = uploadedImages.length > 0 ? uploadedImages : [fallbackImage];
    const image = productImages[0];
    const sellerPhoto = await fileToDataUrl(sellerPhotoFile, 640);
    const description = buildEnglishWholesaleDescription(String(formData.get("description") || ""), {
      version: 1,
      minimumOrderQuantity: String(formData.get("minimumOrderQuantity") || ""),
      images: productImages,
      delivery: {
        method: String(formData.get("deliveryMethod") || ""),
        serviceName: String(formData.get("deliveryServiceName") || ""),
        contact: String(formData.get("deliveryContact") || ""),
      },
      geo: {
        country,
        city,
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
      },
    });

    const product = await createProduct({
      title: toEnglishText(formData.get("title")),
      price: Number(formData.get("price") || 0),
      category: String(formData.get("category") || "Telephones") as ProductCategory,
      image,
      images: productImages,
      description,
      location: toEnglishText(city),
      city: toEnglishText(city),
      country,
      latitude,
      longitude,
      minimumOrderQuantity: String(formData.get("minimumOrderQuantity") || ""),
      deliveryMethod: String(formData.get("deliveryMethod") || ""),
      deliveryServiceName: toEnglishText(formData.get("deliveryServiceName")),
      deliveryContact: String(formData.get("deliveryContact") || ""),
      sellerPhone: String(formData.get("sellerPhone") || ""),
      sellerName: toEnglishText(formData.get("sellerName") || "Shopfy Seller", "Shopfy Seller"),
      sellerPhoto,
    });

    setIsSaving(false);

    if (!product) {
      setErrorMessageKey("sell.error");
      return;
    }

    router.push(getSupplierProfileHref(product.sellerPhone));
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
          {formError || errorMessageKey ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {formError || (errorMessageKey ? t(errorMessageKey) : "")}
            </p>
          ) : null}

          <div className="grid w-full max-w-full gap-5 md:grid-cols-2">
            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{t("sell.titleLabel")}</span>
              <input name="title" required maxLength={80} suppressHydrationWarning placeholder={t("sell.titlePlaceholder")} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{t("sell.priceLabel")}</span>
              <input name="price" required type="number" min="1" suppressHydrationWarning placeholder={t("sell.pricePlaceholder")} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{copy.moqLabel}</span>
              <input name="minimumOrderQuantity" required type="number" min="1" suppressHydrationWarning placeholder={copy.moqPlaceholder} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{t("sell.categoryLabel")}</span>
              <select name="category" suppressHydrationWarning className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100">
                {productCategories.map((category) => (
                  <option key={category} value={category}>{categoryLabel(category)}</option>
                ))}
              </select>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{copy.cityLabel}</span>
              <input name="city" required suppressHydrationWarning placeholder={copy.cityPlaceholder} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <PhoneInput className="md:col-span-2" />

            <div className="grid gap-5 border-t border-gray-100 pt-5 md:col-span-2 md:grid-cols-2">
              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-black text-gray-900">{copy.latitudeLabel}</span>
                <input name="latitude" type="number" step="any" min="-90" max="90" inputMode="decimal" suppressHydrationWarning placeholder={copy.latitudePlaceholder} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>

              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-black text-gray-900">{copy.longitudeLabel}</span>
                <input name="longitude" type="number" step="any" min="-180" max="180" inputMode="decimal" suppressHydrationWarning placeholder={copy.longitudePlaceholder} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>
            </div>

            <div className="grid gap-5 border-t border-gray-100 pt-5 md:col-span-2 md:grid-cols-3">
              <fieldset className="grid min-w-0 gap-2 md:col-span-3">
                <legend className="text-sm font-black text-gray-900">{copy.deliveryMethodLabel}</legend>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {copy.deliveryMethods.map((method, index) => (
                    <label key={method} className="min-w-0 cursor-pointer">
                      <input
                        name="deliveryMethod"
                        type="radio"
                        suppressHydrationWarning
                        value={method}
                        required
                        defaultChecked={index === 0}
                        className="peer sr-only"
                      />
                      <span className="flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-3 text-center text-sm font-black text-gray-950 shadow-sm transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 active:scale-[0.98] peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-checked:text-white peer-checked:shadow-md peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-orange-100 dark:border-white/20 dark:bg-gray-950 dark:text-white dark:hover:border-orange-300 dark:hover:bg-orange-400/10 dark:peer-checked:border-orange-400 dark:peer-checked:bg-orange-500">
                        {method}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-black text-gray-900">{copy.deliveryServiceLabel}</span>
                <input name="deliveryServiceName" suppressHydrationWarning placeholder={copy.deliveryServicePlaceholder} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>

              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-black text-gray-900">{copy.deliveryContactLabel}</span>
                <input name="deliveryContact" required type="tel" suppressHydrationWarning placeholder={copy.deliveryContactPlaceholder} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>
            </div>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{t("sell.sellerNameLabel")}</span>
              <input name="sellerName" suppressHydrationWarning placeholder={t("sell.sellerNamePlaceholder")} className="min-h-12 w-full max-w-full rounded-2xl border border-gray-200 px-4 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-black text-gray-900">{t("sell.sellerPhotoLabel")}</span>
              <input
                name="sellerPhoto"
                required
                type="file"
                suppressHydrationWarning
                accept="image/jpeg,image/png,image/webp"
                onChange={handleSupplierPhotoChange}
                onInvalid={(event) => {
                  event.currentTarget.setCustomValidity(copy.supplierImageRequired);
                  setFormError(copy.supplierImageRequired);
                }}
                onInput={(event) => event.currentTarget.setCustomValidity("")}
                className="w-full max-w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm"
              />
              {supplierImagePreview ? (
                <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <Image
                    src={supplierImagePreview}
                    alt={copy.supplierImagePreviewAlt}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-xl border border-gray-200 bg-white object-cover"
                  />
                  <p className="text-sm font-bold text-gray-700">{copy.supplierImageReady}</p>
                </div>
              ) : null}
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className="text-sm font-black text-gray-900">{copy.imagesLabel}</span>
              <input name="images" type="file" accept="image/*" multiple suppressHydrationWarning onChange={handleProductImagesChange} className="w-full max-w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm" />
              <span className="text-xs font-bold text-gray-500">
                {selectedImageCount > 0 ? copy.imageCount(selectedImageCount) : copy.imageHelper}
              </span>
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className="text-sm font-black text-gray-900">{t("sell.descriptionLabel")}</span>
              <textarea name="description" required rows={5} suppressHydrationWarning placeholder={t("sell.descriptionPlaceholder")} className="w-full max-w-full resize-y rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
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

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && String(value || "").trim() !== "" ? numberValue : undefined;
}

function isAllowedSupplierImage(file: File) {
  return SUPPLIER_IMAGE_TYPES.includes(file.type);
}

function getSellWholesaleCopy(language: string) {
  if (language === "en") {
    return {
      moqLabel: "Minimum order quantity",
      moqPlaceholder: "Ex: 50 units",
      cityLabel: "City",
      cityPlaceholder: "Ex: Cotonou",
      latitudeLabel: "Latitude",
      latitudePlaceholder: "Ex: 6.3703",
      longitudeLabel: "Longitude",
      longitudePlaceholder: "Ex: 2.3912",
      deliveryMethodLabel: "Delivery method",
      deliveryMethods: ["Bus", "Truck", "Motorbike", "Cargo", "Local delivery"],
      deliveryServiceLabel: "Delivery service",
      deliveryServicePlaceholder: "Ex: ABC Transport",
      deliveryContactLabel: "Delivery service number",
      deliveryContactPlaceholder: "Transporter WhatsApp or phone",
      supplierImageRequired: "Add a supplier logo or representative photo before creating the profile.",
      supplierImageFormat: "Use a JPG, PNG, or WEBP image for the supplier photo.",
      supplierImageHelper: "Required: JPG, PNG, or WEBP. The image is compressed automatically for mobile.",
      supplierImageReady: "Supplier image ready",
      supplierImagePreviewAlt: "Supplier image preview",
      imagesLabel: "Product photos (max. 3)",
      imageHelper: "First photo is used as the main listing image.",
      imageLimit: "You can add a maximum of 3 photos per product.",
      imageCount: (count: number) => `${count}/3 photo(s) selected`,
    };
  }

  return {
    moqLabel: "Quantité minimale de commande",
    moqPlaceholder: "Ex: 50 unités",
    cityLabel: "Ville",
    cityPlaceholder: "Ex: Cotonou",
    latitudeLabel: "Latitude",
    latitudePlaceholder: "Ex: 6.3703",
    longitudeLabel: "Longitude",
    longitudePlaceholder: "Ex: 2.3912",
    deliveryMethodLabel: "Moyen de livraison",
    deliveryMethods: ["Bus", "Camion", "Moto", "Cargo", "Livraison locale"],
    deliveryServiceLabel: "Service de livraison",
    deliveryServicePlaceholder: "Ex: ABC Transport",
    deliveryContactLabel: "Numero du service de livraison",
    deliveryContactPlaceholder: "WhatsApp ou telephone du transporteur",
    supplierImageRequired: "Ajoutez un logo ou une photo du fournisseur avant de créer le profil.",
    supplierImageFormat: "Utilisez une image JPG, PNG ou WEBP pour la photo du fournisseur.",
    supplierImageHelper: "Obligatoire : JPG, PNG ou WEBP. L'image est compressée automatiquement pour mobile.",
    supplierImageReady: "Image fournisseur prête",
    supplierImagePreviewAlt: "Aperçu de l'image fournisseur",
    imagesLabel: "Photos produit (max. 3)",
    imageHelper: "La première photo sera l'image principale de l'annonce.",
    imageLimit: "Vous pouvez ajouter 3 photos maximum par produit.",
    imageCount: (count: number) => `${count}/3 photo(s) sélectionnée(s)`,
  };
}
