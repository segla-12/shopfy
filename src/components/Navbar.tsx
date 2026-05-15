import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="shrink-0 text-2xl font-black tracking-tight text-orange-500">
          Shopfy
        </Link>

        <div className="hidden flex-1 md:block">
          <input
            type="search"
            placeholder="Rechercher un produit..."
            className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
        </div>

        <nav className="ml-auto hidden shrink-0 items-center gap-6 text-sm font-semibold text-gray-600 md:flex">
          <Link className="hover:text-orange-500" href="/">Accueil</Link>
          <Link className="hover:text-orange-500" href="/sell">Vendre</Link>
          <Link className="hover:text-orange-500" href="/manage">Compte</Link>
        </nav>
      </div>
    </header>
  );
}
