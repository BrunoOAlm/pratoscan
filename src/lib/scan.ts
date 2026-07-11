import { z } from "zod";
import { gemini, MODELO_GEMINI, schemaParaGemini, validarResposta } from "@/lib/gemini";

// ============================================================================
// Análise de foto de prato com a API do Gemini (visão + saída estruturada).
// Roda SOMENTE no servidor — a chave GEMINI_API_KEY nunca chega ao client.
// ============================================================================

export const MEDIA_TYPES_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;
export type MediaTypeAceito = (typeof MEDIA_TYPES_ACEITOS)[number];

const ItemIdentificado = z.object({
  nome: z.string(),
  porcao: z.string(),
  calorias: z.number(),
  proteina: z.number(),
  carbo: z.number(),
  gordura: z.number(),
});

// ehComida=false cobre selfies, paisagens, fotos escuras demais etc. — o
// modelo sinaliza e a rota devolve um erro amigável em vez de dados inventados.
const AnalisePrato = z.object({
  ehComida: z.boolean(),
  alimentos: z.array(ItemIdentificado),
});

export type AnalisePrato = z.infer<typeof AnalisePrato>;
export type ItemIdentificado = z.infer<typeof ItemIdentificado>;

const SYSTEM_PROMPT = `Você é um nutricionista especializado em estimar valores nutricionais a partir de fotos de refeições.

Regras:
- Identifique cada alimento visível no prato como um item separado (ex.: arroz, feijão e bife são 3 itens).
- Descreva a porção em medidas caseiras brasileiras com o peso estimado entre parênteses, ex.: "4 colheres de sopa (100g)" ou "1 filé médio (120g)".
- As calorias (kcal) e os macronutrientes (gramas) de cada item referem-se à porção estimada VISÍVEL na foto, não a 100g.
- Baseie-se em valores de alimentos brasileiros (Tabela TACO) quando aplicável.
- Seja realista nas estimativas de quantidade: considere o tamanho aparente do prato e dos utensílios.
- Se a imagem não contiver comida, ou estiver impossível de identificar, retorne ehComida=false e alimentos=[].`;

export async function analisarPrato(
  imagemBase64: string,
  mediaType: MediaTypeAceito,
): Promise<AnalisePrato | null> {
  const interacao = await gemini.interactions.create({
    model: MODELO_GEMINI,
    system_instruction: SYSTEM_PROMPT,
    input: [
      { type: "image", data: imagemBase64, mime_type: mediaType },
      {
        type: "text",
        text: "Identifique os alimentos deste prato e estime as calorias e os macronutrientes de cada um.",
      },
    ],
    // Saída estruturada: o modelo é obrigado a responder JSON no formato
    // do schema — sem isso ele poderia devolver texto livre.
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: schemaParaGemini(AnalisePrato),
    },
  });

  // null se a resposta veio vazia ou não validou contra o schema
  return validarResposta(AnalisePrato, interacao.output_text);
}
