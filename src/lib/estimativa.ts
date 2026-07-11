import { z } from "zod";
import { gemini, MODELO_GEMINI, schemaParaGemini, validarResposta } from "@/lib/gemini";

// ============================================================================
// Estimativa nutricional por TEXTO (sem foto): o usuário digita o alimento
// ("pão com requeijão") e a IA estima porção, calorias e macros.
// Complementa o scan por foto no formulário de adicionar alimento manualmente.
// Roda SOMENTE no servidor — a chave GEMINI_API_KEY nunca chega ao client.
// ============================================================================

const EstimativaAlimento = z.object({
  // false para texto que não é comida ("asdfgh", "meu carro") — a rota devolve
  // erro amigável em vez de números inventados
  ehAlimento: z.boolean(),
  porcao: z.string(),
  calorias: z.number(),
  proteina: z.number(),
  carbo: z.number(),
  gordura: z.number(),
});

export type EstimativaAlimento = z.infer<typeof EstimativaAlimento>;

const SYSTEM_PROMPT = `Você é um nutricionista especializado em estimar valores nutricionais de alimentos descritos em texto.

Regras:
- O usuário descreve um alimento ou preparação em português do Brasil, ex.: "pão com requeijão", "2 fatias de pizza de calabresa".
- Se a descrição não indicar quantidade, assuma UMA porção típica brasileira e descreva-a em medidas caseiras com o peso estimado entre parênteses, ex.: "1 pão francês com requeijão (60g)".
- Se a descrição indicar quantidade ("2 fatias..."), use exatamente essa quantidade na porção.
- As calorias (kcal) e os macronutrientes (gramas) referem-se à porção descrita, não a 100g.
- Baseie-se em valores de alimentos brasileiros (Tabela TACO) quando aplicável.
- Se o texto não descrever comida ou bebida, retorne ehAlimento=false e zere os demais campos.`;

export async function estimarAlimento(descricao: string): Promise<EstimativaAlimento | null> {
  const interacao = await gemini.interactions.create({
    model: MODELO_GEMINI,
    system_instruction: SYSTEM_PROMPT,
    input: `Estime os valores nutricionais de: ${descricao}`,
    // Saída estruturada: o modelo é obrigado a responder JSON no formato
    // do schema — sem isso ele poderia devolver texto livre.
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: schemaParaGemini(EstimativaAlimento),
    },
  });

  // null se a resposta veio vazia ou não validou contra o schema
  return validarResposta(EstimativaAlimento, interacao.output_text);
}
