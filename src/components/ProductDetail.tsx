"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { getProductById } from "@/services/productService";
import type { Product } from "@/types/marketplace";
import { CertifiedBadge } from "@/ui/CertifiedBadge";
import { WhatsappButton } from "@/ui/WhatsappButton";

type ProductDetailProps = {
  productId: string;
  initialProduct?: Product | null;
};

export function ProductDetail({ productId, initialProduct = null }: ProductDetailProps) {
  const [localProduct, setLocalProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(!initialProduct);

  useEffect(() => {
    if (initialProduct) {
      return;
    }

    let isMounted = true;

    async function loadProduct() {
      const foundProduct = await getProductById(productId);

      if (isMounted) {
        setLocalProduct(foundProduct);
        setIsLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [initialProduct, productId]);

  const product = initialProduct || localProduct;

  if (isLoading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="aspect-[4/3] animate-pulse bg-gray-100" />
          <div className="grid gap-4 p-4 md:p-6">
            <div className="h-7 w-2/3 animate-pulse rounded-full bg-gray-100" />
            <div className="h-8 w-40 animate-pulse rounded-full bg-gray-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10">
          <h1 className="text-3xl font-black text-gray-950">Produit introuvable</h1>
          <p className="mt-3 text-gray-500">Cette annonce n&apos;existe pas ou a ete retiree.</p>
        </div>
      </section>
    );
  }

  const productLocation = product.location || product.category;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="relative aspect-[4/3] overflow-hidden bg-white p-4">
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-contain object-center"
          />
          {product.isCertified ? (
            <CertifiedBadge className="absolute right-3 top-3" />
          ) : null}
        </div>

        <div className="grid gap-4 p-4 md:p-6">
          <div>
            {product.isCertified ? (
              <CertifiedBadge className="mb-2 w-fit" />
            ) : null}
            <h1 className="text-xl font-black text-gray-950 md:text-2xl">{product.title}</h1>
          </div>

          <p className="text-2xl font-black text-orange-500">{formatPrice(product.price)} FCFA</p>

          <div className="grid gap-4 border-t border-gray-100 pt-4">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-black text-gray-950">Localisation</p>
              <p className="mt-1 text-gray-600">{productLocation}</p>
            </div>

            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-gray-950">DESCRIPTION</h2>
              <p className="mt-2 block max-h-none overflow-visible whitespace-pre-wrap break-all leading-8 text-gray-700">
                {product.description}
              </p>
            </section>

            <WhatsappButton phone={product.sellerPhone} label="Commander" className="min-h-11 w-full px-5 sm:w-fit" />
          </div>
        </div>
      </article>
    </section>
  );
}
