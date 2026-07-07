"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Navegação inferior fixa com 3 itens; o Scan é o botão central destacado.
export default function BottomNav() {
  const pathname = usePathname();

  const corItem = (rota: string) =>
    pathname.startsWith(rota) ? "text-lime-400" : "text-zinc-500";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-center justify-around px-6 py-2">
        <Link
          href="/diario"
          className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition-colors ${corItem("/diario")}`}
        >
          <span className="text-2xl leading-none">📖</span>
          Diário
        </Link>

        {/* Botão central do Scan: maior, elevado e com destaque lime */}
        <Link href="/scan" aria-label="Escanear prato" className="-mt-7">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-400 text-3xl shadow-lg shadow-lime-400/30 transition active:scale-95">
            📷
          </span>
        </Link>

        <Link
          href="/perfil"
          className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition-colors ${corItem("/perfil")}`}
        >
          <span className="text-2xl leading-none">👤</span>
          Perfil
        </Link>
      </div>
    </nav>
  );
}
