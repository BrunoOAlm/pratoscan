"use client";

import { motion } from "framer-motion";

// ============================================================================
// Bloco visual do topo do diário: anel de calorias + barras de macros.
// Client component só pela animação — os números chegam prontos do servidor.
// ============================================================================

interface Props {
  consumido: number; // kcal
  meta: number; // kcal
  macros: {
    proteina: { consumido: number; meta: number };
    carbo: { consumido: number; meta: number };
    gordura: { consumido: number; meta: number };
  };
}

// Geometria do anel: SVG 200x200, raio 84 → circunferência ~527.
// O progresso é desenhado controlando o strokeDashoffset (técnica padrão
// de "donut chart" em SVG: dasharray = circunferência inteira, offset =
// parte que fica vazia).
const RAIO = 84;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

export default function ResumoDia({ consumido, meta, macros }: Props) {
  const fracao = Math.min(consumido / meta, 1);
  const estourou = consumido > meta;
  const restantes = Math.round(meta - consumido);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      {/* Anel de calorias */}
      <div className="relative mx-auto h-52 w-52">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={RAIO} fill="none" strokeWidth="14" className="stroke-zinc-800" />
          <motion.circle
            cx="100"
            cy="100"
            r={RAIO}
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            className={estourou ? "stroke-orange-400" : "stroke-lime-400"}
            strokeDasharray={CIRCUNFERENCIA}
            initial={{ strokeDashoffset: CIRCUNFERENCIA }}
            animate={{ strokeDashoffset: CIRCUNFERENCIA * (1 - fracao) }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.p
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {Math.round(consumido).toLocaleString("pt-BR")}
          </motion.p>
          <p className="text-sm text-zinc-400">de {meta.toLocaleString("pt-BR")} kcal</p>
          <p className={`mt-1 text-xs font-medium ${estourou ? "text-orange-400" : "text-lime-400"}`}>
            {estourou
              ? `${Math.abs(restantes).toLocaleString("pt-BR")} acima da meta`
              : `${restantes.toLocaleString("pt-BR")} restantes`}
          </p>
        </div>
      </div>

      {/* Barras de macros */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <BarraMacro rotulo="Proteína" {...macros.proteina} />
        <BarraMacro rotulo="Carbo" {...macros.carbo} />
        <BarraMacro rotulo="Gordura" {...macros.gordura} />
      </div>
    </section>
  );
}

function BarraMacro(props: { rotulo: string; consumido: number; meta: number }) {
  const fracao = Math.min(props.consumido / props.meta, 1);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-zinc-400">{props.rotulo}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          className="h-full rounded-full bg-lime-400"
          initial={{ width: 0 }}
          animate={{ width: `${fracao * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      <p className="mt-1 text-xs font-medium">
        {Math.round(props.consumido)}
        <span className="text-zinc-500">/{props.meta}g</span>
      </p>
    </div>
  );
}
