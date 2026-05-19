import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/marketplace";
import { CertifiedBadge } from "@/ui/CertifiedBadge";
import { WhatsappButton } from "@/ui/WhatsappButton";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const isLocalImage = product.image.startsWith("data:");
  const detailHref = `/product/${encodeURIComponent(product.id)}`;

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={detailHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-white p-4">
          <Image
            src={product.image}
            alt={product.title}
            fill
            unoptimized={isLocalImage}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain transition duration-300 group-hover:scale-105"
          />
          {product.isNew ? (
            <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-black uppercase text-white">
              Nouveau
            </span>
          ) : null}
          {product.isCertified ? (
            <CertifiedBadge className="absolute right-3 top-3" />
          ) : null}
        </div>
      </Link>

      <div className="grid gap-3 p-4">
        <div>
          {product.isCertified ? (
            <CertifiedBadge className="mb-2 w-fit" />
          ) : null}
          <h3 className="line-clamp-2 text-base font-black text-gray-950">{product.title}</h3>
        </div>

        <p className="text-xl font-black text-orange-500">{formatPrice(product.price)} FCFA</p>

        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href={detailHref}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-gray-200 text-sm font-bold text-gray-900 transition hover:border-orange-200 hover:text-orange-600"
          >
            Voir détails
          </Link>
          <WhatsappButton phone={product.sellerPhone} />
        </div>
      </div>
    </article>
  );
}
