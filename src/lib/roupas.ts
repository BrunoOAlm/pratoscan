// ============================================================================
// Guarda-roupa do mascote: cada peça é DESBLOQUEADA por progresso real
// (mesma filosofia da gamificação — nada de comprar, tudo conquistado).
// O usuário equipa no máximo uma peça por slot (cabeça / rosto / pescoço).
// User.roupas guarda um JSON com os ids equipados.
// ============================================================================

export type SlotRoupa = "cabeca" | "rosto" | "pescoco";

export interface DadosDesbloqueio {
  totalRefeicoes: number;
  streak: number;
  bateuMetaAlgumDia: boolean;
}

export interface Roupa {
  id: string;
  nome: string;
  emoji: string; // ícone no guarda-roupa
  slot: SlotRoupa;
  requisito: string; // texto mostrado quando bloqueada
  desbloqueada: (d: DadosDesbloqueio) => boolean;
}

export const ROUPAS: Roupa[] = [
  {
    id: "chapeu-chef",
    nome: "Chapéu de chef",
    emoji: "👨‍🍳",
    slot: "cabeca",
    requisito: "Registre sua 1ª refeição",
    desbloqueada: (d) => d.totalRefeicoes >= 1,
  },
  {
    id: "bone",
    nome: "Boné",
    emoji: "🧢",
    slot: "cabeca",
    requisito: "Sequência de 3 dias",
    desbloqueada: (d) => d.streak >= 3,
  },
  {
    id: "oculos",
    nome: "Óculos escuros",
    emoji: "🕶️",
    slot: "rosto",
    requisito: "Sequência de 7 dias",
    desbloqueada: (d) => d.streak >= 7,
  },
  {
    id: "lacinho",
    nome: "Lacinho",
    emoji: "🎀",
    slot: "pescoco",
    requisito: "10 refeições registradas",
    desbloqueada: (d) => d.totalRefeicoes >= 10,
  },
  {
    id: "cachecol",
    nome: "Cachecol",
    emoji: "🧣",
    slot: "pescoco",
    requisito: "30 refeições registradas",
    desbloqueada: (d) => d.totalRefeicoes >= 30,
  },
  {
    id: "medalha",
    nome: "Medalha de ouro",
    emoji: "🥇",
    slot: "pescoco",
    requisito: "Feche um dia na meta (±10%)",
    desbloqueada: (d) => d.bateuMetaAlgumDia,
  },
];

/** Faz o parse defensivo do JSON salvo no banco → ids válidos equipados. */
export function roupasEquipadas(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const ids = JSON.parse(json);
    if (!Array.isArray(ids)) return [];
    return ids.filter((id) => ROUPAS.some((r) => r.id === id));
  } catch {
    return [];
  }
}

/** Valida um pedido de equipar: peças existentes, desbloqueadas e 1 por slot. */
export function validarRoupas(ids: unknown, dados: DadosDesbloqueio): string[] | null {
  if (!Array.isArray(ids) || ids.length > 3) return null;
  const slots = new Set<SlotRoupa>();
  const validas: string[] = [];
  for (const id of ids) {
    const peca = ROUPAS.find((r) => r.id === id);
    if (!peca || !peca.desbloqueada(dados) || slots.has(peca.slot)) return null;
    slots.add(peca.slot);
    validas.push(peca.id);
  }
  return validas;
}
