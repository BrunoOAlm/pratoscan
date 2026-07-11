"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { CorMascote } from "@/lib/avatares";

// ============================================================================
// O mascote do PratoScan (inspiração: Finch) — um passarinho redondo em SVG
// que CRESCE com o hábito do usuário:
//   1 Ovo → 2 Filhote → 3 Jovem (asas) → 4 Adulto (topete) → 5 Lendário (coroa)
//
// Interatividade:
//   - pisca sozinho em intervalos aleatórios
//   - os olhos SEGUEM o dedo/cursor sobre o card
//   - "respira" (leve sobe-e-desce contínuo)
//   - o humor muda olhos e boca (faminto / feliz / empolgado)
// ============================================================================

export type HumorMascote = "faminto" | "feliz" | "empolgado";

interface Props {
  cor: CorMascote;
  estagio: 1 | 2 | 3 | 4 | 5;
  humor: HumorMascote;
  /** Lado do quadrado em px */
  tamanho?: number;
}

export default function Mascote({ cor, estagio, humor, tamanho = 150 }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [piscando, setPiscando] = useState(false);
  const [olhar, setOlhar] = useState({ x: 0, y: 0 }); // deslocamento das pupilas

  // Piscadas em intervalos aleatórios (2.5–6s) — vida sem exagero
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let ativo = true;
    function agendar() {
      timer = setTimeout(() => {
        if (!ativo) return;
        setPiscando(true);
        setTimeout(() => setPiscando(false), 140);
        agendar();
      }, 2500 + Math.random() * 3500);
    }
    agendar();
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, []);

  // Olhos seguem o ponteiro dentro do card
  function seguirPonteiro(e: React.PointerEvent) {
    const area = areaRef.current?.getBoundingClientRect();
    if (!area) return;
    const dx = (e.clientX - (area.left + area.width / 2)) / area.width;
    const dy = (e.clientY - (area.top + area.height / 2)) / area.height;
    setOlhar({ x: Math.max(-1, Math.min(1, dx * 2)) * 4, y: Math.max(-1, Math.min(1, dy * 2)) * 3 });
  }

  const ehOvo = estagio === 1;
  // O corpo cresce um pouco a cada estágio
  const escalaCorpo = [0.85, 0.88, 0.95, 1, 1.05][estagio - 1];

  return (
    <div
      ref={areaRef}
      onPointerMove={seguirPonteiro}
      onPointerLeave={() => setOlhar({ x: 0, y: 0 })}
      style={{ width: tamanho, height: tamanho }}
      className="mx-auto"
    >
      {/* Respiração: leve flutuação contínua do conjunto */}
      <motion.svg
        viewBox="0 0 200 200"
        className="h-full w-full"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        {/* Sombra no chão */}
        <ellipse cx="100" cy="182" rx="46" ry="8" fill="#000" opacity="0.07" />

        <g transform={`translate(100 178) scale(${escalaCorpo}) translate(-100 -178)`}>
          {ehOvo ? (
            <Ovo cor={cor} piscando={piscando} olhar={olhar} />
          ) : (
            <Passarinho cor={cor} estagio={estagio} humor={humor} piscando={piscando} olhar={olhar} />
          )}
        </g>
      </motion.svg>
    </div>
  );
}

// --- Estágio 1: ovo com olhinhos espiando pela rachadura ----------------------

function Ovo(props: { cor: CorMascote; piscando: boolean; olhar: { x: number; y: number } }) {
  return (
    <g>
      <path
        d="M100 42 C 132 42 152 82 152 122 C 152 158 129 178 100 178 C 71 178 48 158 48 122 C 48 82 68 42 100 42 Z"
        fill="#fafaf9"
        stroke="#e7e5e4"
        strokeWidth="3"
      />
      {/* Rachadura por onde o bichinho espia */}
      <path
        d="M64 118 L 76 110 L 84 122 L 96 108 L 108 122 L 120 108 L 130 120 L 138 112"
        fill="none"
        stroke="#d6d3d1"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Interior escuro + olhos */}
      <ellipse cx="100" cy="138" rx="34" ry="24" fill={props.cor.escuro} opacity="0.25" />
      <Olhos cx={100} cy={138} afastamento={14} piscando={props.piscando} olhar={props.olhar} raio={5} />
      <text x="100" y="34" textAnchor="middle" fontSize="13" fill="#a8a29e">
        toc, toc...
      </text>
    </g>
  );
}

// --- Estágios 2–5: o passarinho ----------------------------------------------

function Passarinho(props: {
  cor: CorMascote;
  estagio: 2 | 3 | 4 | 5;
  humor: HumorMascote;
  piscando: boolean;
  olhar: { x: number; y: number };
}) {
  const { cor, estagio, humor } = props;
  return (
    <g>
      {/* Coroa dourada — só o Lendário (dourado é cor de conquista) */}
      {estagio >= 5 && (
        <g>
          <path
            d="M78 38 L 84 22 L 94 32 L 100 18 L 106 32 L 116 22 L 122 38 Z"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="84" cy="22" r="3" fill="#fde68a" />
          <circle cx="100" cy="18" r="3" fill="#fde68a" />
          <circle cx="116" cy="22" r="3" fill="#fde68a" />
        </g>
      )}

      {/* Topete de folhinha — Adulto em diante */}
      {estagio >= 4 && estagio < 5 && (
        <g stroke="#059669" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M100 42 C 100 34 100 30 100 26" />
          <path d="M100 30 C 94 26 90 26 86 28 C 90 32 96 33 100 30 Z" fill="#34d399" stroke="none" />
          <path d="M100 30 C 106 26 110 26 114 28 C 110 32 104 33 100 30 Z" fill="#10b981" stroke="none" />
        </g>
      )}

      {/* Asinhas — Jovem em diante */}
      {estagio >= 3 && (
        <g fill={cor.escuro} opacity="0.85">
          <motion.path
            d="M44 118 C 30 112 26 126 34 136 C 40 143 50 144 56 140 C 52 132 48 124 44 118 Z"
            animate={{ rotate: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            style={{ originX: "56px", originY: "128px" }}
          />
          <motion.path
            d="M156 118 C 170 112 174 126 166 136 C 160 143 150 144 144 140 C 148 132 152 124 156 118 Z"
            animate={{ rotate: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            style={{ originX: "144px", originY: "128px" }}
          />
        </g>
      )}

      {/* Pezinhos */}
      <g fill={cor.escuro}>
        <ellipse cx="84" cy="176" rx="10" ry="5" />
        <ellipse cx="116" cy="176" rx="10" ry="5" />
      </g>

      {/* Corpo */}
      <path
        d="M100 44 C 138 44 158 78 158 118 C 158 154 133 176 100 176 C 67 176 42 154 42 118 C 42 78 62 44 100 44 Z"
        fill={cor.principal}
        stroke={cor.escuro}
        strokeWidth="3"
      />
      {/* Barriga */}
      <ellipse cx="100" cy="140" rx="36" ry="28" fill={cor.claro} />

      {/* Bochechas */}
      <ellipse cx="68" cy="112" rx="9" ry="6" fill="#fda4af" opacity="0.55" />
      <ellipse cx="132" cy="112" rx="9" ry="6" fill="#fda4af" opacity="0.55" />

      {/* Olhos + bico + boca */}
      <Olhos
        cx={100}
        cy={96}
        afastamento={22}
        piscando={props.piscando}
        olhar={props.olhar}
        raio={8}
        empolgado={humor === "empolgado"}
      />
      <path d="M93 108 L 107 108 L 100 118 Z" fill="#f97316" stroke="#ea580c" strokeWidth="2" strokeLinejoin="round" />
      {humor === "faminto" ? (
        // Boquinha aberta pedindo comida
        <ellipse cx="100" cy="127" rx="6" ry="4.5" fill={cor.escuro} opacity="0.7" />
      ) : (
        <path
          d={humor === "empolgado" ? "M90 124 Q 100 134 110 124" : "M92 125 Q 100 131 108 125"}
          fill="none"
          stroke={cor.escuro}
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

// Olhos com pupila que segue o ponteiro; viram estrelinhas quando empolgado
function Olhos(props: {
  cx: number;
  cy: number;
  afastamento: number;
  raio: number;
  piscando: boolean;
  olhar: { x: number; y: number };
  empolgado?: boolean;
}) {
  const { cx, cy, afastamento, raio, piscando, olhar } = props;
  const olhos = [cx - afastamento, cx + afastamento];

  if (props.empolgado && !piscando) {
    // Olhos de estrela ✨
    return (
      <g fill="#3f3f46">
        {olhos.map((x) => (
          <path
            key={x}
            d={`M${x} ${cy - raio} L ${x + raio * 0.35} ${cy - raio * 0.3} L ${x + raio} ${cy} L ${x + raio * 0.35} ${cy + raio * 0.3} L ${x} ${cy + raio} L ${x - raio * 0.35} ${cy + raio * 0.3} L ${x - raio} ${cy} L ${x - raio * 0.35} ${cy - raio * 0.3} Z`}
          />
        ))}
      </g>
    );
  }

  return (
    <g>
      {olhos.map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={cy} rx={raio} ry={piscando ? raio * 0.12 : raio} fill="#3f3f46" />
          {!piscando && (
            <circle cx={x + olhar.x + raio * 0.3} cy={cy + olhar.y - raio * 0.3} r={raio * 0.3} fill="#fff" />
          )}
        </g>
      ))}
    </g>
  );
}
