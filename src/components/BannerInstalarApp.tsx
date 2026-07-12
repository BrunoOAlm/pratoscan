"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

// ============================================================================
// Convite pra instalar o PWA, mostrado nas telas logadas:
//   - Android/Chrome: o navegador dispara "beforeinstallprompt"; guardamos o
//     evento e o botão abre a janelinha NATIVA de instalação.
//   - iPhone/Safari: não existe prompt por código — mostramos a instrução
//     (Compartilhar → Adicionar à Tela de Início).
//   - Já instalado (standalone) ou dispensado: não aparece.
// ============================================================================

// O TypeScript não tem o tipo desse evento (é específico do Chrome)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CHAVE_DISPENSADO = "pratoscan-instalacao-dispensada";

export default function BannerInstalarApp() {
  const [promptNativo, setPromptNativo] = useState<BeforeInstallPromptEvent | null>(null);
  const [mostrarDicaIos, setMostrarDicaIos] = useState(false);

  useEffect(() => {
    // Rodando como app instalado → nada a fazer
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Usuário já fechou o convite antes → respeita a escolha
    if (localStorage.getItem(CHAVE_DISPENSADO)) return;

    // Android/Chrome: o evento chega quando o app é "instalável"
    const aoInstalavel = (e: Event) => {
      e.preventDefault(); // segura o mini-banner do Chrome; mostramos o nosso
      setPromptNativo(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", aoInstalavel);

    // iOS/Safari: sem evento — detecta pelo user agent e mostra a instrução.
    // O atraso evita o banner "piscar" na abertura (e satisfaz a regra de
    // não chamar setState síncrono dentro do effect).
    const ehIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const timer = ehIos ? window.setTimeout(() => setMostrarDicaIos(true), 2000) : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", aoInstalavel);
      window.clearTimeout(timer);
    };
  }, []);

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSADO, "1");
    setPromptNativo(null);
    setMostrarDicaIos(false);
  }

  async function instalar() {
    if (!promptNativo) return;
    await promptNativo.prompt();
    const { outcome } = await promptNativo.userChoice;
    // Aceitou → o banner some; recusou → guarda pra não insistir
    if (outcome === "dismissed") localStorage.setItem(CHAVE_DISPENSADO, "1");
    setPromptNativo(null);
  }

  const visivel = promptNativo !== null || mostrarDicaIos;

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-0 bottom-24 z-40 mx-auto w-full max-w-md px-4"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 shadow-xl ring-1 ring-black/5 backdrop-blur-md">
            <Image
              src="/icons/icone-192.png"
              alt=""
              width={44}
              height={44}
              className="shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Instale o PratoScan</p>
              {promptNativo ? (
                <p className="text-xs text-zinc-500">Vira um app na sua tela inicial.</p>
              ) : (
                <p className="text-xs text-zinc-500">
                  Toque em <span className="font-semibold">Compartilhar</span> →{" "}
                  <span className="font-semibold">Adicionar à Tela de Início</span>.
                </p>
              )}
            </div>
            {promptNativo && (
              <button
                type="button"
                onClick={instalar}
                className="shrink-0 rounded-xl bg-gradient-to-b from-orange-400 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-95"
              >
                Instalar
              </button>
            )}
            <button
              type="button"
              onClick={dispensar}
              aria-label="Dispensar convite de instalação"
              className="shrink-0 rounded-full p-1 text-zinc-400 transition-colors hover:text-zinc-600"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
