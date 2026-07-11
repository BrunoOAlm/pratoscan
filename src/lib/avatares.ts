// Animais disponíveis para o mascote (o campo User.avatar guarda o id).
// Fica fora do route.ts porque rotas só podem exportar handlers HTTP,
// e o client (perfil) também precisa desta lista.

export interface AnimalMascote {
  id: string;
  nome: string;
  principal: string; // corpo
  escuro: string; // contornos/detalhes
  claro: string; // barriga/orelha interna
}

export const ANIMAIS_MASCOTE: AnimalMascote[] = [
  { id: "cachorro", nome: "Caramelo", principal: "#f59e0b", escuro: "#92400e", claro: "#fef3c7" },
  { id: "gato", nome: "Gato", principal: "#94a3b8", escuro: "#475569", claro: "#e2e8f0" },
  { id: "raposa", nome: "Raposa", principal: "#fb923c", escuro: "#c2410c", claro: "#ffedd5" },
  { id: "panda", nome: "Panda", principal: "#fafafa", escuro: "#3f3f46", claro: "#ffffff" },
  { id: "coelho", nome: "Coelho", principal: "#fbcfe8", escuro: "#be185d", claro: "#fdf2f8" },
  { id: "urso", nome: "Urso", principal: "#b45309", escuro: "#713f12", claro: "#fde68a" },
];

// O vira-lata caramelo é o padrão — clássico brasileiro 🇧🇷
export const ANIMAL_PADRAO = ANIMAIS_MASCOTE[0];

/** Resolve o id salvo no banco (ou legado/nulo) para um animal válido. */
export function animalPorId(id: string | null | undefined): AnimalMascote {
  return ANIMAIS_MASCOTE.find((a) => a.id === id) ?? ANIMAL_PADRAO;
}
