"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useAnimate } from "framer-motion";
import type { AnimalMascote } from "@/lib/avatares";
import type { ProgressoAnimal } from "@/lib/gamificacao";
import { falaAleatoria, humorDoMascote, type EstadoMascote } from "@/lib/mascote-humor";
import Mascote from "@/components/Mascote";

// ============================================================================
// Card do mascote no diário (a "casinha" dele no dia a dia): ele mora aqui,
// comenta o teu progresso e lembra de registrar. Tocar nele dá aquele pulo;
// a seta leva ao perfil (coleção, conquistas, gráfico).
// ============================================================================

interface Props {
  nome: string | null;
  animal: AnimalMascote;
  progresso: ProgressoAnimal;
  roupas: string[];
  estado: EstadoMascote; // registrouHoje + streak
}

export default function MascoteDoDia({ nome, animal, progresso, roupas, estado }: Props) {
  const [escopo, animar] = useAnimate();
  const [fala, setFala] = useState(() => falaAleatoria(estado, nome, progresso.estagio.nome));

  function cutucar() {
    animar(escopo.current, { y: [0, -12, 0, -5, 0], rotate: [0, -4, 4, 0] }, { duration: 0.55 });
    setFala(falaAleatoria(estado, nome, progresso.estagio.nome));
  }

  return (
    <section className="cartao entrada flex items-center gap-3 p-4">
      <button type="button" onClick={cutucar} aria-label="Cutucar o mascote" className="shrink-0">
        <span ref={escopo} className="block">
          <Mascote
            animal={animal}
            estagio={progresso.estagio.numero}
            humor={humorDoMascote(estado)}
            roupas={roupas}
            tamanho={96}
          />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <motion.p
          key={fala}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-zinc-700"
        >
          {fala}
        </motion.p>

        {/* Mini progresso do bicho */}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-400">
          <span className="font-semibold text-emerald-600">
            {progresso.estagio.nome} · nv {progresso.nivel}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${(progresso.xpNoNivel / progresso.xpParaSubir) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </div>
        </div>
      </div>

      <Link
        href="/perfil"
        aria-label="Ver perfil e coleção"
        className="shrink-0 rounded-full border border-zinc-200 bg-white p-2 text-zinc-400 transition active:scale-90"
      >
        →
      </Link>
    </section>
  );
}
