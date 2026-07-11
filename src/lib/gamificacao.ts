// ============================================================================
// Gamificação do PratoScan: streak 🔥, XP ⭐, nível e conquistas 🏆.
//
// Decisão de arquitetura: TUDO é derivado das refeições já salvas — nada de
// contadores no banco. Um contador de streak persistido quebra se o usuário
// apagar uma refeição ou mudar o relógio; derivar do dado real é sempre
// consistente e à prova de edição retroativa.
// ============================================================================

import { hojeNoBrasil, somarDias } from "@/lib/datas";

export const XP_POR_REFEICAO = 10;

export interface Gamificacao {
  streak: number; // dias consecutivos com pelo menos 1 refeição
  registrouHoje: boolean;
  xp: number;
  nivel: number;
  xpNoNivel: number; // progresso dentro do nível atual
  xpParaSubir: number; // tamanho do nível atual
  conquistas: Conquista[];
}

export interface Conquista {
  id: string;
  emoji: string;
  titulo: string;
  descricao: string;
  conquistada: boolean;
}

/** Dias distintos (YYYY-MM-DD no fuso do Brasil) a partir das datas das refeições. */
export function diasComRegistro(datasRefeicoes: Date[]): Set<string> {
  return new Set(
    datasRefeicoes.map((d) => d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })),
  );
}

/** Streak: conta para trás a partir de hoje (ou de ontem, se hoje ainda não registrou —
 *  o streak não "quebra" antes do dia acabar). */
export function calcularStreak(dias: Set<string>): { streak: number; registrouHoje: boolean } {
  const hoje = hojeNoBrasil();
  const registrouHoje = dias.has(hoje);
  let cursor = registrouHoje ? hoje : somarDias(hoje, -1);
  let streak = 0;
  while (dias.has(cursor)) {
    streak++;
    cursor = somarDias(cursor, -1);
  }
  return { streak, registrouHoje };
}

/** Nível cresce de forma quadrática suave: subir de nível custa 50 XP a mais
 *  a cada nível (nível 1→2: 50 XP, 2→3: 100 XP...). Clássico de RPG: começo
 *  rápido para engajar, depois desacelera. */
export function calcularNivel(xp: number): { nivel: number; xpNoNivel: number; xpParaSubir: number } {
  let nivel = 1;
  let restante = xp;
  let custo = 50;
  while (restante >= custo) {
    restante -= custo;
    nivel++;
    custo += 50;
  }
  return { nivel, xpNoNivel: restante, xpParaSubir: custo };
}

// --- Crescimento do mascote (inspiração: Finch) -----------------------------
// O bichinho evolui com o NÍVEL — que vem do hábito de registrar refeições.
// Manter o hábito = ver o mascote crescer.

export interface EstagioMascote {
  numero: 1 | 2 | 3 | 4 | 5;
  nome: string;
  /** Nível em que o PRÓXIMO estágio chega (null = estágio final) */
  proximoNivel: number | null;
}

const ESTAGIOS: { numero: 1 | 2 | 3 | 4 | 5; nome: string; nivelMinimo: number }[] = [
  { numero: 1, nome: "Ovo", nivelMinimo: 1 },
  { numero: 2, nome: "Filhote", nivelMinimo: 2 },
  { numero: 3, nome: "Jovem", nivelMinimo: 4 },
  { numero: 4, nome: "Adulto", nivelMinimo: 7 },
  { numero: 5, nome: "Lendário", nivelMinimo: 10 },
];

export function estagioDoMascote(nivel: number): EstagioMascote {
  const atual = [...ESTAGIOS].reverse().find((e) => nivel >= e.nivelMinimo)!;
  const proximo = ESTAGIOS.find((e) => e.nivelMinimo > nivel);
  return { numero: atual.numero, nome: atual.nome, proximoNivel: proximo?.nivelMinimo ?? null };
}

export function montarGamificacao(dados: {
  totalRefeicoes: number;
  datasRefeicoes: Date[];
  bateuMetaAlgumDia: boolean;
}): Gamificacao {
  const dias = diasComRegistro(dados.datasRefeicoes);
  const { streak, registrouHoje } = calcularStreak(dias);
  const xp = dados.totalRefeicoes * XP_POR_REFEICAO;

  const conquistas: Conquista[] = [
    {
      id: "primeira-refeicao",
      emoji: "🍽️",
      titulo: "Primeiro prato",
      descricao: "Registre sua primeira refeição",
      conquistada: dados.totalRefeicoes >= 1,
    },
    {
      id: "dez-refeicoes",
      emoji: "📷",
      titulo: "Dez no diário",
      descricao: "Registre 10 refeições",
      conquistada: dados.totalRefeicoes >= 10,
    },
    {
      id: "trinta-refeicoes",
      emoji: "🥇",
      titulo: "Trinta e contando",
      descricao: "Registre 30 refeições",
      conquistada: dados.totalRefeicoes >= 30,
    },
    {
      id: "streak-3",
      emoji: "🔥",
      titulo: "Pegando fogo",
      descricao: "3 dias seguidos registrando",
      conquistada: streak >= 3,
    },
    {
      id: "streak-7",
      emoji: "🚀",
      titulo: "Semana perfeita",
      descricao: "7 dias seguidos registrando",
      conquistada: streak >= 7,
    },
    {
      id: "meta-batida",
      emoji: "🎯",
      titulo: "Na mosca",
      descricao: "Feche um dia dentro da meta (±10%)",
      conquistada: dados.bateuMetaAlgumDia,
    },
  ];

  return { streak, registrouHoje, xp, ...calcularNivel(xp), conquistas };
}
