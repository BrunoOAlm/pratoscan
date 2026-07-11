"use client";

import { motion } from "framer-motion";

// ============================================================================
// Bloco visual do topo do diário (layout de referência "Lean AI"):
//   - à esquerda, o número-herói: calorias RESTANTES (não as consumidas —
//     é o que o usuário decide com ele: "quanto ainda posso comer?")
//   - à direita, o anel de progresso com a chama
//   - abaixo, um mini-anel por macro, cada um com sua cor
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

// Progresso em anel SVG: dasharray = circunferência inteira e o offset
// controla a parte vazia (técnica padrão de "donut chart")
function Anel(props: {
  fracao: number;
  raio: number;
  espessura: number;
  classeCor: string;
  children?: React.ReactNode;
}) {
  const lado = props.raio * 2 + props.espessura * 2;
  const centro = lado / 2;
  const circ = 2 * Math.PI * props.raio;
  return (
    <div className="relative" style={{ width: lado, height: lado }}>
      <svg viewBox={`0 0 ${lado} ${lado}`} className="h-full w-full -rotate-90">
        <circle
          cx={centro}
          cy={centro}
          r={props.raio}
          fill="none"
          strokeWidth={props.espessura}
          className="stroke-white/[0.07]"
        />
        <motion.circle
          cx={centro}
          cy={centro}
          r={props.raio}
          fill="none"
          strokeWidth={props.espessura}
          strokeLinecap="round"
          className={props.classeCor}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - Math.min(props.fracao, 1)) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{props.children}</div>
    </div>
  );
}

export default function ResumoDia({ consumido, meta, macros }: Props) {
  const estourou = consumido > meta;
  const restantes = Math.round(meta - consumido);

  return (
    <section className="cartao p-5">
      {/* Número-herói + anel de calorias */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-zinc-400">
            {estourou ? "Acima da meta" : "Calorias restantes"}
          </p>
          <motion.p
            className={`mt-1 text-5xl font-bold leading-none tracking-tighter tabular-nums ${
              estourou ? "text-orange-400" : ""
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {Math.abs(restantes).toLocaleString("pt-BR")}
            <span className="ml-1.5 text-base font-medium tracking-normal text-zinc-500">
              kcal
            </span>
          </motion.p>
          <p className="mt-2 text-sm text-zinc-500 tabular-nums">
            {Math.round(consumido).toLocaleString("pt-BR")} de {meta.toLocaleString("pt-BR")}{" "}
            consumidas
          </p>
        </div>
        <Anel
          fracao={consumido / meta}
          raio={44}
          espessura={10}
          classeCor={
            estourou
              ? "stroke-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.45)]"
              : "stroke-lime-400 drop-shadow-[0_0_10px_rgba(163,230,53,0.45)]"
          }
        >
          <span className="text-2xl">🔥</span>
        </Anel>
      </div>

      {/* Mini-anéis dos macros — cada um com sua cor (referência) */}
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
        <MiniMacro rotulo="Proteína" classeCor="stroke-sky-400" {...macros.proteina} />
        <MiniMacro rotulo="Carbo" classeCor="stroke-emerald-400" {...macros.carbo} />
        <MiniMacro rotulo="Gordura" classeCor="stroke-amber-400" {...macros.gordura} />
      </div>
    </section>
  );
}

function MiniMacro(props: {
  rotulo: string;
  classeCor: string;
  consumido: number;
  meta: number;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <Anel fracao={props.consumido / props.meta} raio={24} espessura={5} classeCor={props.classeCor}>
        <span className="text-xs font-bold tabular-nums">{Math.round(props.consumido)}</span>
      </Anel>
      <p className="mt-1.5 text-xs font-medium text-zinc-400">{props.rotulo}</p>
      <p className="text-[11px] text-zinc-600 tabular-nums">de {props.meta}g</p>
    </div>
  );
}
