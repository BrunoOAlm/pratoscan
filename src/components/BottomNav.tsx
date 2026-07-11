"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { guardarFotoPendente } from "@/lib/foto-pendente";

// Navegação inferior fixa com 3 itens; o Scan é o botão central destacado.
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const corItem = (rota: string) =>
    pathname.startsWith(rota) ? "text-lime-400" : "text-zinc-500";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-zinc-950/75 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-center justify-around px-6 py-2">
        <Link
          href="/diario"
          className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition-colors ${corItem("/diario")}`}
        >
          <span className="text-2xl leading-none">📖</span>
          Diário
        </Link>

        {/* Botão central do Scan: abre a câmera DIRETO (o input precisa estar
            aqui — o navegador só abre a câmera no toque do usuário). A foto
            escolhida vai para o ScanFlow via foto-pendente. */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const foto = e.target.files?.[0];
            e.target.value = ""; // permite escolher o mesmo arquivo de novo
            if (!foto) return; // usuário cancelou a câmera
            guardarFotoPendente(foto);
            if (pathname !== "/scan") router.push("/scan");
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Escanear prato"
          className="-mt-7"
        >
          {/* Halo translúcido atrás do botão: destaca sem pesar */}
          <span className="flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full bg-lime-400/15">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-lime-300 to-lime-500 text-3xl shadow-lg shadow-lime-500/40 transition active:scale-95">
              📷
            </span>
          </span>
        </button>

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
