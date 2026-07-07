// ============================================================================
// Distribuição de macronutrientes sugerida a partir da meta calórica.
//
// Split fixo no código na v1 (não configurável pelo usuário):
//   proteína 30% / carboidrato 40% / gordura 30%
//
// Conversão kcal → gramas usa as densidades calóricas clássicas:
//   proteína 4 kcal/g · carboidrato 4 kcal/g · gordura 9 kcal/g
//
// Não salvamos os macros no banco: são sempre deriváveis de metaCalorias,
// então guardar seria redundância (e um risco de dessincronizar).
// ============================================================================

const SPLIT = {
  proteina: 0.3,
  carbo: 0.4,
  gordura: 0.3,
} as const;

const KCAL_POR_GRAMA = {
  proteina: 4,
  carbo: 4,
  gordura: 9,
} as const;

export interface MetaMacros {
  proteinaG: number;
  carboG: number;
  gorduraG: number;
}

export function calcularMetaMacros(metaCalorias: number): MetaMacros {
  return {
    proteinaG: Math.round((metaCalorias * SPLIT.proteina) / KCAL_POR_GRAMA.proteina),
    carboG: Math.round((metaCalorias * SPLIT.carbo) / KCAL_POR_GRAMA.carbo),
    gorduraG: Math.round((metaCalorias * SPLIT.gordura) / KCAL_POR_GRAMA.gordura),
  };
}
