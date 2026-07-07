import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// ============================================================================
// Análise de foto de prato com a API da Claude (visão + saída estruturada).
// Roda SOMENTE no servidor — a chave ANTHROPIC_API_KEY nunca chega ao client.
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

const client = new Anthropic(); // lê ANTHROPIC_API_KEY do ambiente

export async function analisarPrato(
  imagemBase64: string,
  mediaType: MediaTypeAceito,
): Promise<AnalisePrato | null> {
  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    // Adaptive thinking melhora a estimativa de porções; effort "medium"
    // segura a latência — o usuário está esperando com a câmera na mão.
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(AnalisePrato),
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imagemBase64 },
          },
          {
            type: "text",
            text: "Identifique os alimentos deste prato e estime as calorias e os macronutrientes de cada um.",
          },
        ],
      },
    ],
  });

  // parsed_output é null se o modelo recusou ou a resposta não validou
  return response.parsed_output;
}
