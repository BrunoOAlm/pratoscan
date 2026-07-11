"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { ANIMAIS_MASCOTE, type AnimalMascote } from "@/lib/avatares";
import { estagioDoMascote, type Gamificacao } from "@/lib/gamificacao";
import Mascote, { type HumorMascote } from "@/components/Mascote";

// ============================================================================
// Topo gamificado do perfil:
//   - mascote estilo Finch: cresce por estágios conforme o nível (que vem do
//     hábito de registrar), reage ao toque com pulo + partículas e fala
//   - nível + barra de XP (10 XP por refeição registrada)
//   - conquistas 🏆 — DOURADO é reservado para elas (decisão de paleta)
//   - gráfico simples dos últimos 7 dias vs meta
// ============================================================================

interface DiaSemana {
  rotulo: string;
  letra: string;
  kcal: number;
}

interface Props {
  nome: string | null;
  animal: AnimalMascote;
  gamificacao: Gamificacao;
  semana: DiaSemana[];
  meta: number;
}

function humorDoMascote(g: Gamificacao): HumorMascote {
  if (!g.registrouHoje) return "faminto";
  if (g.streak >= 3) return "empolgado";
  return "feliz";
}

// Falas por estado — uma aleatória a cada toque
function falasDoMascote(g: Gamificacao, nome: string | null, estagioNome: string): string[] {
  const oi = nome ?? "você";
  if (estagioNome === "Bebê") {
    return [
      "Sou só um bebê... me alimenta direitinho! 🍼",
      "Registra refeições que eu cresço rapidinho 🌱",
      `Cuida de mim, ${oi}! 🥺`,
    ];
  }
  if (!g.registrouHoje) {
    return [
      "Tô com fome... registra uma refeição! 🍽️",
      "Nada no diário hoje ainda 👀",
      `Bora fotografar o prato, ${oi}? 📷`,
      "Me alimenta que eu cresço! 🌱",
    ];
  }
  if (g.streak >= 7) {
    return [
      `${g.streak} dias seguidos, que orgulho! 🚀`,
      "A gente tá imparável! 🔥",
      "Olha o tamanho que eu tô ficando! 💪",
    ];
  }
  if (g.streak >= 3) {
    return [`${g.streak} dias de sequência! 🔥`, "Tamo pegando fogo! 🔥", "Continua assim que eu cresço! 🌱"];
  }
  return ["Registrou hoje, mandou bem! ✅", "Tamo juntos nessa! 💪", "Cada refeição me deixa mais forte 🌱"];
}

interface Particula {
  id: number;
  x: number;
  emoji: string;
}

export default function PerfilGamificado({ nome, animal, gamificacao, semana, meta }: Props) {
  const router = useRouter();
  const [escopo, animar] = useAnimate();
  const estagio = estagioDoMascote(gamificacao.nivel);
  const [fala, setFala] = useState(() => falasDoMascote(gamificacao, nome, estagio.nome)[0]);
  const [escolhendo, setEscolhendo] = useState(false);
  const [salvandoCor, setSalvandoCor] = useState(false);
  const [particulas, setParticulas] = useState<Particula[]>([]);

  // Toque no mascote: pulo + partículas + fala nova
  function cutucar() {
    animar(escopo.current, { y: [0, -20, 0, -8, 0], rotate: [0, -5, 5, -2, 0] }, { duration: 0.65 });

    const emojis = gamificacao.registrouHoje ? ["💚", "✨", "⭐"] : ["🍽️", "💭", "🥕"];
    const novas = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 120,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setParticulas((atual) => [...atual, ...novas]);
    setTimeout(() => setParticulas((atual) => atual.filter((p) => !novas.includes(p))), 1200);

    const falas = falasDoMascote(gamificacao, nome, estagio.nome);
    setFala(falas[Math.floor(Math.random() * falas.length)]);
  }

  async function trocarAnimal(novo: AnimalMascote) {
    if (salvandoCor) return;
    setSalvandoCor(true);
    const resposta = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar: novo.id }),
    });
    setSalvandoCor(false);
    if (resposta.ok) {
      setEscolhendo(false);
      router.refresh();
    }
  }

  const conquistadas = gamificacao.conquistas.filter((c) => c.conquistada).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Mascote */}
      <section className="cartao relative overflow-hidden p-5 text-center">
        {gamificacao.streak > 0 && (
          <span className="absolute right-4 top-4 z-10 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-bold tabular-nums text-orange-600">
            🔥 {gamificacao.streak}
          </span>
        )}

        {/* Balão de fala */}
        <AnimatePresence mode="wait">
          <motion.p
            key={fala}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto inline-block rounded-2xl rounded-bl-sm border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600"
          >
            {fala}
          </motion.p>
        </AnimatePresence>

        {/* Mascote + partículas ao cutucar */}
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
            <AnimatePresence>
              {particulas.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, y: 40, x: p.x * 0.3, scale: 0.6 }}
                  animate={{ opacity: 0, y: -50, x: p.x, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  className="absolute text-xl"
                >
                  {p.emoji}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <button type="button" onClick={cutucar} aria-label="Cutucar o mascote" className="w-full">
            <span ref={escopo} className="block">
              <Mascote animal={animal} estagio={estagio.numero} humor={humorDoMascote(gamificacao)} tamanho={150} />
            </span>
          </button>
        </div>

        <p className="text-lg font-bold tracking-tight">{nome ?? "Seu perfil"}</p>
        {/* Estágio de crescimento — o coração do "Finch": manter o hábito faz crescer */}
        <p className="mt-0.5 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-500">{estagio.nome}</span>
          {estagio.proximoNivel !== null && <> · evolui no nível {estagio.proximoNivel}</>}
          {estagio.proximoNivel === null && <> · forma final ✨</>}
        </p>

        {/* Nível + barra de XP */}
        <div className="mx-auto mt-3 max-w-xs">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-bold text-emerald-600">Nível {gamificacao.nivel}</span>
            <span className="tabular-nums text-zinc-400">
              {gamificacao.xpNoNivel}/{gamificacao.xpParaSubir} XP
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${(gamificacao.xpNoNivel / gamificacao.xpParaSubir) * 100}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-400">⭐ 10 XP por refeição registrada</p>
        </div>

        <button
          type="button"
          onClick={() => setEscolhendo(!escolhendo)}
          className="mt-4 text-xs font-medium text-emerald-600"
        >
          {escolhendo ? "fechar" : "trocar de bichinho"}
        </button>

        {/* Escolha do animal — miniaturas de verdade, não bolinhas de cor */}
        <AnimatePresence>
          {escolhendo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid grid-cols-3 gap-2">
                {ANIMAIS_MASCOTE.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    disabled={salvandoCor}
                    onClick={() => trocarAnimal(a)}
                    aria-label={`Escolher ${a.nome}`}
                    className={`flex flex-col items-center rounded-2xl border px-1 py-2 transition active:scale-95 ${
                      a.id === animal.id ? "border-emerald-500/60 bg-emerald-500/10" : "border-zinc-200 bg-white"
                    }`}
                  >
                    <Mascote animal={a} estagio={estagio.numero} humor="feliz" tamanho={56} estatico />
                    <span className="mt-1 text-[11px] font-medium text-zinc-500">{a.nome}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Conquistas — dourado é a cor delas */}
      <section className="cartao p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold tracking-tight">Conquistas</h2>
          <span className="text-xs tabular-nums text-zinc-400">
            {conquistadas}/{gamificacao.conquistas.length}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {gamificacao.conquistas.map((c) => (
            <div
              key={c.id}
              title={c.descricao}
              className={`flex flex-col items-center rounded-2xl border px-2 py-3 text-center ${
                c.conquistada
                  ? "border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100 shadow-[0_4px_14px_-6px_rgba(245,158,11,0.4)]"
                  : "border-zinc-200 bg-zinc-50 opacity-55 grayscale"
              }`}
            >
              <span className="text-2xl">{c.conquistada ? c.emoji : "🔒"}</span>
              <span
                className={`mt-1 text-[11px] font-semibold leading-tight ${
                  c.conquistada ? "text-amber-700" : "text-zinc-500"
                }`}
              >
                {c.titulo}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Gráfico da semana */}
      <GraficoSemana semana={semana} meta={meta} />
    </div>
  );
}

// --- Gráfico dos últimos 7 dias ----------------------------------------------
// Barras finas com topo arredondado, linha da meta tracejada e tooltip por
// toque (mobile). Valores sempre acessíveis: o dia tocado mostra o número.

function GraficoSemana({ semana, meta }: { semana: DiaSemana[]; meta: number }) {
  const [ativo, setAtivo] = useState(semana.length - 1); // hoje começa selecionado

  const LARGURA = 320;
  const ALTURA = 120;
  const TOPO = 26; // espaço para o tooltip/rótulo
  const maximo = Math.max(meta * 1.15, ...semana.map((d) => d.kcal));
  const escalaY = (kcal: number) => (kcal / maximo) * (ALTURA - TOPO);
  const larguraBarra = 26;
  const passo = LARGURA / 7;
  const yMeta = ALTURA - escalaY(meta);

  return (
    <section className="cartao p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold tracking-tight">Sua semana</h2>
        <span className="text-xs text-zinc-400">kcal por dia</span>
      </div>

      <svg viewBox={`0 0 ${LARGURA} ${ALTURA + 18}`} className="mt-3 w-full" role="img" aria-label="Calorias dos últimos 7 dias">
        {/* Linha da meta */}
        <line x1="0" y1={yMeta} x2={LARGURA} y2={yMeta} stroke="#d4d4d8" strokeWidth="1.5" strokeDasharray="4 4" />
        <text x={LARGURA} y={yMeta - 4} textAnchor="end" className="fill-zinc-400" fontSize="9">
          meta {meta.toLocaleString("pt-BR")}
        </text>

        {semana.map((d, i) => {
          const x = i * passo + (passo - larguraBarra) / 2;
          const altura = Math.max(d.kcal > 0 ? 3 : 0, escalaY(d.kcal));
          const y = ALTURA - altura;
          const selecionado = i === ativo;
          return (
            // Área de toque da coluna inteira — maior que a barra em si
            <g key={i} onClick={() => setAtivo(i)} className="cursor-pointer">
              <rect x={i * passo} y="0" width={passo} height={ALTURA + 18} fill="transparent" />
              {d.kcal > 0 && (
                <motion.rect
                  x={x}
                  width={larguraBarra}
                  rx="4"
                  fill={selecionado ? "#059669" : "#a7f3d0"}
                  initial={{ y: ALTURA, height: 0 }}
                  animate={{ y, height: altura }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                />
              )}
              {/* Valor do dia selecionado */}
              {selecionado && d.kcal > 0 && (
                <text x={x + larguraBarra / 2} y={y - 6} textAnchor="middle" className="fill-emerald-700" fontSize="11" fontWeight="700">
                  {d.kcal.toLocaleString("pt-BR")}
                </text>
              )}
              <text
                x={x + larguraBarra / 2}
                y={ALTURA + 13}
                textAnchor="middle"
                fontSize="9"
                fontWeight={selecionado ? "700" : "500"}
                className={selecionado ? "fill-emerald-700" : "fill-zinc-400"}
              >
                {d.letra}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-center text-xs text-zinc-400">{semana[ativo].rotulo}</p>
    </section>
  );
}
