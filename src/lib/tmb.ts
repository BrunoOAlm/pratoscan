import type { NivelAtividade, Objetivo, Sexo } from "@prisma/client";

// ============================================================================
// Cálculo da meta calórica diária
//
// Três etapas:
//   1. TMB (Taxa Metabólica Basal) — quantas kcal o corpo gasta em repouso.
//      Usamos a fórmula de Mifflin-St Jeor (1990), considerada a mais precisa
//      para a população geral:
//        Homens:   TMB = 10×peso(kg) + 6.25×altura(cm) − 5×idade + 5
//        Mulheres: TMB = 10×peso(kg) + 6.25×altura(cm) − 5×idade − 161
//
//   2. GET (Gasto Energético Total) = TMB × fator de atividade física.
//      O fator estima o gasto extra do dia a dia (trabalho, exercício etc.).
//
//   3. Ajuste pelo objetivo:
//      - Perder peso:  déficit de 500 kcal/dia  (~0,5 kg de gordura/semana)
//      - Ganhar peso:  superávit de 300 kcal/dia (ganho de massa gradual)
//      - Manter:       sem ajuste
// ============================================================================

const FATOR_ATIVIDADE: Record<NivelAtividade, number> = {
  SEDENTARIO: 1.2, //  pouco ou nenhum exercício
  LEVE: 1.375, //      exercício leve 1-3x/semana
  MODERADO: 1.55, //   exercício moderado 3-5x/semana
  ATIVO: 1.725, //     exercício intenso 6-7x/semana
  MUITO_ATIVO: 1.9, // exercício muito intenso + trabalho físico
};

const AJUSTE_OBJETIVO: Record<Objetivo, number> = {
  PERDER: -500,
  MANTER: 0,
  GANHAR: 300,
};

// Piso de segurança: nunca sugerir uma meta abaixo disso, mesmo que o déficit
// calculado resulte em menos (ex.: pessoa leve + sedentária + querendo perder).
const META_MINIMA_KCAL = 1200;

export interface DadosOnboarding {
  peso: number; // kg
  altura: number; // cm
  idade: number;
  sexo: Sexo;
  nivelAtividade: NivelAtividade;
  objetivo: Objetivo;
}

export function calcularTMB(dados: DadosOnboarding): number {
  const { peso, altura, idade, sexo } = dados;
  const base = 10 * peso + 6.25 * altura - 5 * idade;
  return sexo === "MASCULINO" ? base + 5 : base - 161;
}

export function calcularMetaCalorias(dados: DadosOnboarding): number {
  const tmb = calcularTMB(dados);
  const gastoTotal = tmb * FATOR_ATIVIDADE[dados.nivelAtividade];
  const meta = gastoTotal + AJUSTE_OBJETIVO[dados.objetivo];
  return Math.max(Math.round(meta), META_MINIMA_KCAL);
}
