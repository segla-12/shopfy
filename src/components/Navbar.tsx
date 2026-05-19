import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:px-4 md:h-16 md:flex-row md:items-center md:gap-4 md:py-0">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:contents">
          <Link href="/" className="shrink-0 text-center text-2xl font-black tracking-tight text-orange-500 sm:text-left">
            Shopfy
          </Link>

          <nav className="grid w-full min-w-0 grid-cols-3 gap-2 text-center text-xs font-black text-gray-600 sm:w-auto sm:min-w-fit sm:flex sm:items-center sm:justify-end md:ml-auto md:order-3 md:gap-3 md:text-sm">
            <Link className="min-w-0 rounded-full px-2 py-2 transition hover:bg-orange-50 hover:text-orange-500 md:px-3" href="/">Accueil</Link>
            <Link className="min-w-0 rounded-full px-2 py-2 transition hover:bg-orange-50 hover:text-orange-500 md:px-3" href="/sell">Vendre</Link>
            <Link className="min-w-0 rounded-full px-2 py-2 transition hover:bg-orange-50 hover:text-orange-500 md:px-3" href="/manage">Compte</Link>
          </nav>
        </div>

        <div className="w-full min-w-0 flex-1 md:order-2 md:block">
          <input
            type="search"
            placeholder="Rechercher un produit..."
            className="h-11 w-full max-w-full rounded-full border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
        </div>
      </div>
    </header>
  );
}
