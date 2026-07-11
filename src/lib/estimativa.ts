import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// ============================================================================
// Estimativa nutricional por TEXTO (sem foto): o usuário digita o alimento
// ("pão com requeijão") e a IA estima porção, calorias e macros.
// Complementa o scan por foto no formulário de adicionar alimento manualmente.
// Roda SOMENTE no servidor — a chave ANTHROPIC_API_KEY nunca chega ao client.
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

const client = new Anthropic(); // lê ANTHROPIC_API_KEY do ambiente

export async function estimarAlimento(descricao: string): Promise<EstimativaAlimento | null> {
  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: {
      // effort "low": estimativa de UM alimento é tarefa simples e o usuário
      // está esperando com o formulário aberto — latência importa mais aqui
      effort: "low",
      format: zodOutputFormat(EstimativaAlimento),
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Estime os valores nutricionais de: ${descricao}`,
      },
    ],
  });

  // parsed_output é null se o modelo recusou ou a resposta não validou
  return response.parsed_output;
}
