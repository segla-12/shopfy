import { ButtonLink } from "@/ui/ButtonLink";
import Image from "next/image";

export function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.1fr_0.9fr] md:py-16">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-orange-500">Marketplace premium</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-gray-950 md:text-6xl">
            Trouve, compare et contacte les vendeurs plus vite.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            Shopfy rassemble les produits locaux dans une experience claire, rapide et prete pour passer a Supabase.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="#products">Explorer les produits</ButtonLink>
            <ButtonLink href="/sell" variant="secondary">Publier une annonce</ButtonLink>
          </div>
        </div>

        <div className="relative h-[360px] overflow-hidden rounded-3xl bg-gray-950 shadow-2xl">
          <Image
            src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1000&q=80"
            alt="Achat en ligne sur marketplace"
            fill
            priority
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover opacity-90"
          />
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
            <p className="text-sm font-black text-gray-950">Produits verifies visuellement</p>
            <p className="mt-1 text-sm text-gray-500">Recherche, categories et fiches produit deja structurees.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
