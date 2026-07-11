"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { AnimalMascote } from "@/lib/avatares";

// ============================================================================
// O mascote do PratoScan (inspiração: Finch) — um bichinho redondo em SVG.
// O usuário escolhe o ANIMAL (orelhas, focinho e marcas mudam); o corpo
// fofinho é compartilhado. Ele CRESCE com o hábito, de forma coerente para
// qualquer animal:
//   1 Bebê (menorzinho, com chupeta) → 2 Filhote → 3 Jovem (ganha bandana)
//   → 4 Adulto → 5 Lendário (coroa dourada + estrelas)
//
// Interatividade:
//   - pisca sozinho em intervalos aleatórios
//   - os olhos SEGUEM o dedo/cursor sobre o card
//   - "respira" (leve sobe-e-desce contínuo)
//   - o humor muda olhos e boca (faminto / feliz / empolgado)
// ============================================================================

export type HumorMascote = "faminto" | "feliz" | "empolgado";

interface Props {
  animal: AnimalMascote;
  estagio: 1 | 2 | 3 | 4 | 5;
  humor: HumorMascote;
  /** Ids das roupas equipadas (lib/roupas) */
  roupas?: string[];
  /** Lado do quadrado em px */
  tamanho?: number;
  /** Desliga piscada/olhar (miniaturas do seletor) */
  estatico?: boolean;
}

export default function Mascote({ animal, estagio, humor, roupas = [], tamanho = 150, estatico = false }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [piscando, setPiscando] = useState(false);
  const [olhar, setOlhar] = useState({ x: 0, y: 0 }); // deslocamento das pupilas

  // Piscadas em intervalos aleatórios (2.5–6s) — vida sem exagero
  useEffect(() => {
    if (estatico) return;
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
  }, [estatico]);

  // Olhos seguem o ponteiro dentro do card
  function seguirPonteiro(e: React.PointerEvent) {
    if (estatico) return;
    const area = areaRef.current?.getBoundingClientRect();
    if (!area) return;
    const dx = (e.clientX - (area.left + area.width / 2)) / area.width;
    const dy = (e.clientY - (area.top + area.height / 2)) / area.height;
    setOlhar({ x: Math.max(-1, Math.min(1, dx * 2)) * 4, y: Math.max(-1, Math.min(1, dy * 2)) * 3 });
  }

  // Bebê é bem pequenininho; cresce a cada estágio
  const escala = [0.68, 0.8, 0.9, 1, 1.05][estagio - 1];

  const conteudo = (
    <g transform={`translate(100 178) scale(${escala}) translate(-100 -178)`}>
      <Bicho animal={animal} estagio={estagio} humor={humor} roupas={roupas} piscando={piscando} olhar={olhar} />
    </g>
  );

  return (
    <div
      ref={areaRef}
      onPointerMove={seguirPonteiro}
      onPointerLeave={() => setOlhar({ x: 0, y: 0 })}
      style={{ width: tamanho, height: tamanho }}
      className="mx-auto"
    >
      {estatico ? (
        <svg viewBox="0 0 200 200" className="h-full w-full">{conteudo}</svg>
      ) : (
        <motion.svg
          viewBox="0 0 200 200"
          className="h-full w-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <ellipse cx="100" cy="182" rx="46" ry="8" fill="#000" opacity="0.07" />
          {conteudo}
        </motion.svg>
      )}
    </div>
  );
}

// --- O bicho -----------------------------------------------------------------

function Bicho(props: {
  animal: AnimalMascote;
  estagio: 1 | 2 | 3 | 4 | 5;
  humor: HumorMascote;
  roupas: string[];
  piscando: boolean;
  olhar: { x: number; y: number };
}) {
  const { animal, estagio, humor, roupas } = props;
  const bebe = estagio === 1;
  const tem = (id: string) => roupas.includes(id);
  // A coroa do Lendário domina a cabeça; roupas de cabeça só até o estágio 4
  const roupaCabeca = estagio < 5;
  const temPescoco = tem("lacinho") || tem("cachecol") || tem("medalha");

  return (
    <g>
      {/* Orelhas (atrás do corpo) */}
      <Orelhas animal={animal} />

      {/* Coroa dourada — só o Lendário (dourado é cor de conquista) */}
      {estagio >= 5 && (
        <g>
          <path
            d="M78 36 L 84 20 L 94 30 L 100 16 L 106 30 L 116 20 L 122 36 Z"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="84" cy="20" r="3" fill="#fde68a" />
          <circle cx="100" cy="16" r="3" fill="#fde68a" />
          <circle cx="116" cy="20" r="3" fill="#fde68a" />
          {/* Estrelinhas flutuando */}
          <motion.g
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            fill="#fbbf24"
          >
            <path d="M40 70 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 Z" />
            <path d="M158 62 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 Z" />
          </motion.g>
        </g>
      )}

      {/* Pezinhos */}
      <g fill={animal.escuro}>
        <ellipse cx="84" cy="176" rx="10" ry="5" />
        <ellipse cx="116" cy="176" rx="10" ry="5" />
      </g>

      {/* Corpo */}
      <path
        d="M100 44 C 138 44 158 78 158 118 C 158 154 133 176 100 176 C 67 176 42 154 42 118 C 42 78 62 44 100 44 Z"
        fill={animal.principal}
        stroke={animal.escuro}
        strokeWidth="3"
      />
      {/* Barriga */}
      <ellipse cx="100" cy="142" rx="34" ry="26" fill={animal.claro} />

      {/* Marcas próprias do animal (focinho da raposa, manchas do panda...) */}
      <MarcasDoRosto animal={animal} />

      {/* Bochechas */}
      <ellipse cx="66" cy="112" rx="9" ry="6" fill="#fda4af" opacity="0.55" />
      <ellipse cx="134" cy="112" rx="9" ry="6" fill="#fda4af" opacity="0.55" />

      {/* Olhos */}
      <Olhos
        cx={100}
        cy={96}
        afastamento={22}
        piscando={props.piscando}
        olhar={props.olhar}
        raio={8}
        empolgado={humor === "empolgado"}
      />

      {/* Nariz */}
      <ellipse cx="100" cy="110" rx="6" ry="4.5" fill={animal.id === "panda" ? "#3f3f46" : animal.escuro} />

      {/* Bigodes (gato e coelho) */}
      {(animal.id === "gato" || animal.id === "coelho") && (
        <g stroke={animal.escuro} strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
          <line x1="52" y1="108" x2="72" y2="110" />
          <line x1="52" y1="116" x2="72" y2="114" />
          <line x1="148" y1="108" x2="128" y2="110" />
          <line x1="148" y1="116" x2="128" y2="114" />
        </g>
      )}

      {/* Boca (ou chupeta de bebê) */}
      {bebe ? (
        <g>
          <circle cx="100" cy="124" r="7" fill="#fda4af" stroke="#e11d48" strokeWidth="2" />
          <circle cx="100" cy="124" r="2.5" fill="#e11d48" />
        </g>
      ) : humor === "faminto" ? (
        <ellipse cx="100" cy="124" rx="6" ry="4.5" fill={animal.escuro} opacity="0.7" />
      ) : (
        <path
          d={humor === "empolgado" ? "M90 120 Q 100 130 110 120" : "M92 121 Q 100 127 108 121"}
          fill="none"
          stroke={animal.escuro}
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}

      {/* Bandana — Jovem em diante; sai de cena se houver roupa no pescoço */}
      {estagio >= 3 && estagio < 5 && !temPescoco && (
        <g>
          <path
            d="M62 148 C 78 158 122 158 138 148 L 134 160 C 118 168 82 168 66 160 Z"
            fill={animal.id === "cachorro" || animal.id === "urso" ? "#dc2626" : "#059669"}
            stroke="none"
            opacity="0.9"
          />
          <path d="M134 158 l10 8 -4 -12 Z" fill={animal.id === "cachorro" || animal.id === "urso" ? "#b91c1c" : "#047857"} />
        </g>
      )}

      {/* ------ Guarda-roupa (desbloqueado por conquistas) ------ */}

      {/* Cachecol */}
      {tem("cachecol") && (
        <g>
          <path
            d="M60 146 C 78 157 122 157 140 146 L 137 160 C 120 169 80 169 63 160 Z"
            fill="#dc2626"
          />
          <rect x="118" y="156" width="14" height="26" rx="4" fill="#dc2626" />
          <g stroke="#b91c1c" strokeWidth="2">
            <line x1="121" y1="176" x2="121" y2="182" />
            <line x1="125" y1="176" x2="125" y2="182" />
            <line x1="129" y1="176" x2="129" y2="182" />
          </g>
        </g>
      )}

      {/* Lacinho */}
      {tem("lacinho") && (
        <g fill="#ec4899" stroke="#be185d" strokeWidth="2" strokeLinejoin="round">
          <path d="M100 152 L 82 143 L 82 161 Z" />
          <path d="M100 152 L 118 143 L 118 161 Z" />
          <circle cx="100" cy="152" r="5" fill="#db2777" />
        </g>
      )}

      {/* Medalha de ouro (dourado = conquista) */}
      {tem("medalha") && (
        <g>
          <path d="M88 148 L 100 164 L 112 148" fill="none" stroke="#2563eb" strokeWidth="5" />
          <circle cx="100" cy="167" r="9" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
          <path d="M100 162 l1.6 3.2 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 Z" fill="#d97706" />
        </g>
      )}

      {/* Óculos escuros */}
      {tem("oculos") && (
        <g>
          <rect x="64" y="86" width="28" height="20" rx="9" fill="#27272a" opacity="0.9" />
          <rect x="108" y="86" width="28" height="20" rx="9" fill="#27272a" opacity="0.9" />
          <line x1="92" y1="94" x2="108" y2="94" stroke="#27272a" strokeWidth="4" />
          <line x1="64" y1="92" x2="48" y2="86" stroke="#27272a" strokeWidth="4" strokeLinecap="round" />
          <line x1="136" y1="92" x2="152" y2="86" stroke="#27272a" strokeWidth="4" strokeLinecap="round" />
          <rect x="70" y="89" width="9" height="5" rx="2.5" fill="#fff" opacity="0.25" />
          <rect x="114" y="89" width="9" height="5" rx="2.5" fill="#fff" opacity="0.25" />
        </g>
      )}

      {/* Chapéu de chef */}
      {roupaCabeca && tem("chapeu-chef") && (
        <g>
          <circle cx="82" cy="34" r="13" fill="#fff" stroke="#d4d4d8" strokeWidth="2" />
          <circle cx="100" cy="28" r="15" fill="#fff" stroke="#d4d4d8" strokeWidth="2" />
          <circle cx="118" cy="34" r="13" fill="#fff" stroke="#d4d4d8" strokeWidth="2" />
          <rect x="76" y="36" width="48" height="18" rx="3" fill="#fff" stroke="#d4d4d8" strokeWidth="2" />
        </g>
      )}

      {/* Boné */}
      {roupaCabeca && tem("bone") && (
        <g>
          <path d="M68 54 A 32 26 0 0 1 132 54 L 132 58 L 68 58 Z" fill="#059669" stroke="#047857" strokeWidth="2" />
          <path d="M100 48 L 100 58 L 148 58 A 8 8 0 0 0 144 46 C 130 42 112 44 100 48 Z" fill="#047857" />
          <circle cx="100" cy="38" r="4" fill="#34d399" stroke="#047857" strokeWidth="1.5" />
        </g>
      )}
    </g>
  );
}

// Orelhas por animal — desenhadas atrás do corpo
function Orelhas({ animal }: { animal: AnimalMascote }) {
  switch (animal.id) {
    case "gato":
      return (
        <g stroke={animal.escuro} strokeWidth="3" strokeLinejoin="round">
          <path d="M58 74 L 64 38 L 92 54 Z" fill={animal.principal} />
          <path d="M142 74 L 136 38 L 108 54 Z" fill={animal.principal} />
          <path d="M64 66 L 68 46 L 84 56 Z" fill={animal.claro} stroke="none" />
          <path d="M136 66 L 132 46 L 116 56 Z" fill={animal.claro} stroke="none" />
        </g>
      );
    case "raposa":
      return (
        <g stroke={animal.escuro} strokeWidth="3" strokeLinejoin="round">
          <path d="M54 80 L 58 30 L 94 52 Z" fill={animal.principal} />
          <path d="M146 80 L 142 30 L 106 52 Z" fill={animal.principal} />
          <path d="M62 70 L 64 42 L 86 56 Z" fill="#3f3f46" stroke="none" opacity="0.75" />
          <path d="M138 70 L 136 42 L 114 56 Z" fill="#3f3f46" stroke="none" opacity="0.75" />
        </g>
      );
    case "cachorro":
      return (
        <g>
          <ellipse cx="56" cy="82" rx="15" ry="27" fill={animal.escuro} transform="rotate(18 56 82)" />
          <ellipse cx="144" cy="82" rx="15" ry="27" fill={animal.escuro} transform="rotate(-18 144 82)" />
        </g>
      );
    case "panda":
      return (
        <g>
          <circle cx="62" cy="52" r="15" fill="#3f3f46" />
          <circle cx="138" cy="52" r="15" fill="#3f3f46" />
        </g>
      );
    case "coelho":
      return (
        <g stroke={animal.escuro} strokeWidth="3">
          <ellipse cx="76" cy="34" rx="11" ry="30" fill={animal.principal} transform="rotate(-8 76 34)" />
          <ellipse cx="124" cy="34" rx="11" ry="30" fill={animal.principal} transform="rotate(8 124 34)" />
          <ellipse cx="76" cy="36" rx="5" ry="20" fill="#fda4af" stroke="none" transform="rotate(-8 76 36)" />
          <ellipse cx="124" cy="36" rx="5" ry="20" fill="#fda4af" stroke="none" transform="rotate(8 124 36)" />
        </g>
      );
    case "urso":
    default:
      return (
        <g stroke={animal.escuro} strokeWidth="3">
          <circle cx="64" cy="54" r="13" fill={animal.principal} />
          <circle cx="136" cy="54" r="13" fill={animal.principal} />
          <circle cx="64" cy="54" r="6" fill={animal.claro} stroke="none" />
          <circle cx="136" cy="54" r="6" fill={animal.claro} stroke="none" />
        </g>
      );
  }
}

// Marcas de rosto por animal (por cima do corpo, atrás dos olhos)
function MarcasDoRosto({ animal }: { animal: AnimalMascote }) {
  switch (animal.id) {
    case "raposa":
      // Focinho branco característico
      return <ellipse cx="100" cy="116" rx="26" ry="18" fill="#fff" opacity="0.9" />;
    case "panda":
      // Manchas nos olhos
      return (
        <g fill="#52525b">
          <ellipse cx="78" cy="96" rx="14" ry="16" transform="rotate(-12 78 96)" />
          <ellipse cx="122" cy="96" rx="14" ry="16" transform="rotate(12 122 96)" />
        </g>
      );
    case "cachorro":
      // Mancha caramelo-escura em volta de um olho — charme de vira-lata
      return <ellipse cx="122" cy="94" rx="13" ry="15" fill={animal.escuro} opacity="0.28" transform="rotate(10 122 94)" />;
    default:
      return null;
  }
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
