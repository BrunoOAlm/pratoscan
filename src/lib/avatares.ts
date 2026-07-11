// Cores disponíveis para o mascote (o campo User.avatar guarda o id).
// Fica fora do route.ts porque rotas só podem exportar handlers HTTP,
// e o client (perfil) também precisa desta lista.

export interface CorMascote {
  id: string;
  nome: string;
  principal: string; // corpo
  escuro: string; // contornos/detalhes
  claro: string; // barriga
}

export const CORES_MASCOTE: CorMascote[] = [
  { id: "esmeralda", nome: "Esmeralda", principal: "#34d399", escuro: "#059669", claro: "#d1fae5" },
  { id: "laranja", nome: "Laranja", principal: "#fb923c", escuro: "#ea580c", claro: "#ffedd5" },
  { id: "ceu", nome: "Céu", principal: "#38bdf8", escuro: "#0284c7", claro: "#e0f2fe" },
  { id: "rosa", nome: "Rosa", principal: "#f472b6", escuro: "#db2777", claro: "#fce7f3" },
  { id: "violeta", nome: "Violeta", principal: "#a78bfa", escuro: "#7c3aed", claro: "#ede9fe" },
  { id: "ambar", nome: "Âmbar", principal: "#fbbf24", escuro: "#d97706", claro: "#fef3c7" },
];

export const COR_PADRAO = CORES_MASCOTE[0];

/** Resolve o id salvo no banco (ou legado/nulo) para uma cor válida. */
export function corPorId(id: string | null | undefined): CorMascote {
  return CORES_MASCOTE.find((c) => c.id === id) ?? COR_PADRAO;
}
